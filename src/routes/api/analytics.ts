import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { environment } from "#environment";
import { CACHE_DURATION } from "#environment/constants";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

const cache = new Map<
	string,
	{
		data: object;
		timestamp: number;
		fileHashes: Map<string, number>;
	}
>();

const API_ROUTE_REGEX = /^\/api\/|^\/public\/|\./;

async function getFileModificationTimes(
	logFiles: string[],
	logsDir: string,
): Promise<Map<string, number>> {
	const fileTimes = new Map<string, number>();

	await Promise.all(
		logFiles.map(async (file) => {
			try {
				const filePath = resolve(logsDir, file);
				const stats = await stat(filePath);
				fileTimes.set(file, stats.mtimeMs);
			} catch {}
		}),
	);

	return fileTimes;
}

function hasFilesChanged(
	cachedHashes: Map<string, number>,
	currentHashes: Map<string, number>,
): boolean {
	if (cachedHashes.size !== currentHashes.size) return true;

	for (const [file, mtime] of currentHashes) {
		if (cachedHashes.get(file) !== mtime) return true;
	}

	return false;
}

async function processLogFiles(
	logFiles: string[],
	logsDir: string,
	filterRoute: string | null,
) {
	const pageViews = new Map<string, number>();
	const uniquePageViews = new Map<string, Set<string>>();

	await Promise.all(
		logFiles.map(async (file) => {
			try {
				const filePath = resolve(logsDir, file);
				const content = await Bun.file(filePath).text();
				const lines = content.trim().split("\n");

				for (const line of lines) {
					if (!line) continue;

					try {
						const entry: LogEntry = JSON.parse(line);

						if (entry.level !== "GET" || entry.data?.context !== "200") {
							continue;
						}

						const [url, , ip] = entry.data.data;
						if (!url || !ip) continue;

						const urlStart = url.indexOf("://");
						if (urlStart === -1) continue;

						const hostStart = urlStart + 3;
						const pathStart = url.indexOf("/", hostStart);
						const pathname: string =
							pathStart === -1
								? "/"
								: url.substring(pathStart).split("?")[0] || "/";

						if (API_ROUTE_REGEX.test(pathname)) {
							continue;
						}

						if (filterRoute && pathname !== filterRoute) {
							continue;
						}

						pageViews.set(pathname, (pageViews.get(pathname) || 0) + 1);

						if (!uniquePageViews.has(pathname)) {
							uniquePageViews.set(pathname, new Set());
						}
						uniquePageViews.get(pathname)?.add(ip);
					} catch {}
				}
			} catch {}
		}),
	);

	return { pageViews, uniquePageViews };
}

async function handler(request: ExtendedRequest): Promise<Response> {
	try {
		const { route } = request.query;
		const filterRoute = typeof route === "string" ? route : null;
		const cacheKey = filterRoute || "all";
		const now = Date.now();

		const logsDir = resolve("logs");
		let logFiles: string[];

		try {
			const allFiles = await readdir(logsDir);
			logFiles = allFiles.filter((file) => file.endsWith(".jsonl"));
		} catch {
			return Response.json({ views: [], total: 0 });
		}

		if (logFiles.length === 0) {
			return Response.json({ views: [], total: 0 });
		}

		const cachedEntry = cache.get(cacheKey);
		if (cachedEntry && !environment.development) {
			const timeSinceCache = now - cachedEntry.timestamp;

			if (timeSinceCache < CACHE_DURATION) {
				const currentFileHashes = await getFileModificationTimes(
					logFiles,
					logsDir,
				);

				if (!hasFilesChanged(cachedEntry.fileHashes, currentFileHashes)) {
					return Response.json(cachedEntry.data);
				}
			}
		}

		const fileHashes = await getFileModificationTimes(logFiles, logsDir);

		const { pageViews, uniquePageViews } = await processLogFiles(
			logFiles,
			logsDir,
			filterRoute,
		);

		const views: ViewsData[] = Array.from(pageViews.entries())
			.map(([page, viewCount]) => ({
				page: page === "/" ? "/" : page,
				views: viewCount,
				uniqueViews: uniquePageViews.get(page)?.size || 0,
			}))
			.sort((a, b) => b.views - a.views);

		const totalViews = Array.from(pageViews.values()).reduce(
			(sum, count) => sum + count,
			0,
		);

		const responseData = {
			views,
			total: totalViews,
			filterRoute,
			lastUpdate: now,
			nextUpdate: now + CACHE_DURATION,
		};

		cache.set(cacheKey, {
			data: responseData,
			timestamp: now,
			fileHashes,
		});

		return Response.json(responseData);
	} catch (error) {
		return Response.json(
			{
				error: "Failed to fetch analytics data",
				details: (error as Error).message,
			},
			{ status: 500 },
		);
	}
}

export { handler, routeDef };
