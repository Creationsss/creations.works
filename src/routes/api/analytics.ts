import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { environment } from "#environment";
import { CACHE_DURATION } from "#environment/constants";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

const cachedData: { [key: string]: object } = {};
const cacheTimestamps: { [key: string]: number } = {};

async function handler(request: ExtendedRequest): Promise<Response> {
	try {
		const { route } = request.query;
		const filterRoute = typeof route === "string" ? route : null;
		const cacheKey = filterRoute || "all";
		const now = Date.now();

		if (
			cachedData[cacheKey] &&
			cacheTimestamps[cacheKey] &&
			now - cacheTimestamps[cacheKey] < CACHE_DURATION &&
			!environment.development
		) {
			return Response.json(cachedData[cacheKey]);
		}

		const logsDir = resolve("logs");
		const logFiles = await readdir(logsDir);
		const jsonlFiles = logFiles.filter((file) => file.endsWith(".jsonl"));

		if (jsonlFiles.length === 0) {
			return Response.json({ views: [], total: 0 });
		}

		const pageViews = new Map<string, number>();
		const uniquePageViews = new Map<string, Set<string>>();

		for (const file of jsonlFiles) {
			const filePath = resolve(logsDir, file);
			const content = await Bun.file(filePath).text();
			const lines = content
				.trim()
				.split("\n")
				.filter((line) => line.length > 0);

			for (const line of lines) {
				try {
					const entry: LogEntry = JSON.parse(line);

					if (entry.level === "GET" && entry.data?.context === "200") {
						const [url, , ip] = entry.data.data;
						const urlObj = new URL(url);
						const pathname = urlObj.pathname;

						if (
							pathname.startsWith("/api/") ||
							pathname.startsWith("/public/") ||
							pathname.includes(".")
						) {
							continue;
						}

						if (filterRoute && pathname !== filterRoute) {
							continue;
						}

						pageViews.set(pathname, (pageViews.get(pathname) || 0) + 1);

						if (!uniquePageViews.has(pathname)) {
							uniquePageViews.set(pathname, new Set());
						}
						const ipSet = uniquePageViews.get(pathname);
						if (ipSet) {
							ipSet.add(ip);
						}
					}
				} catch {}
			}
		}

		const views: ViewsData[] = Array.from(pageViews.entries())
			.map(([page, viewCount]) => {
				const result: ViewsData = {
					page: page === "/" ? "/" : page,
					views: viewCount,
					uniqueViews: uniquePageViews.get(page)?.size || 0,
				};

				return result;
			})
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

		cachedData[cacheKey] = responseData;
		cacheTimestamps[cacheKey] = now;

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
