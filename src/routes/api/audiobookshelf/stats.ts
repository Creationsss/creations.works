import { audiobookshelf, environment } from "#environment";
import { CACHE_DURATION } from "#environment/constants";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

let cachedData: object | null = null;
let cacheTimestamp = 0;

async function handler(): Promise<Response> {
	const now = Date.now();

	if (
		cachedData &&
		cacheTimestamp &&
		now - cacheTimestamp < CACHE_DURATION &&
		!environment.development
	) {
		return Response.json(cachedData);
	}

	if (!audiobookshelf.url || !audiobookshelf.token) {
		return Response.json(
			{ error: "Audiobookshelf stats unavailable" },
			{ status: 503 },
		);
	}

	try {
		const baseUrl = audiobookshelf.url.startsWith("http")
			? audiobookshelf.url
			: `https://${audiobookshelf.url}`;

		const headers = { Authorization: `Bearer ${audiobookshelf.token}` };

		const [listeningStatsResponse, authorizeResponse, librariesResponse] =
			await Promise.all([
				fetch(`${baseUrl}/api/me/listening-stats`, { headers }),
				fetch(`${baseUrl}/api/authorize`, { headers, method: "POST" }),
				fetch(`${baseUrl}/api/libraries`, { headers }),
			]);

		if (!listeningStatsResponse.ok) {
			throw new Error(
				`Audiobookshelf listening stats API error: ${listeningStatsResponse.status}`,
			);
		}

		if (!authorizeResponse.ok) {
			throw new Error(
				`Audiobookshelf authorize API error: ${authorizeResponse.status}`,
			);
		}

		if (!librariesResponse.ok) {
			throw new Error(
				`Audiobookshelf libraries API error: ${librariesResponse.status}`,
			);
		}

		const listeningStatsData = await listeningStatsResponse.json();
		const authorizeData = await authorizeResponse.json();
		const librariesData: LibrariesResponse = await librariesResponse.json();

		const allowedLibraries = librariesData.libraries.filter((lib: Library) => {
			if (lib.mediaType !== "book") return false;
			if (
				audiobookshelf.libraryIds.length > 0 &&
				!audiobookshelf.libraryIds.includes(lib.id)
			) {
				return false;
			}
			return true;
		});

		const libraryItemsPromises = allowedLibraries.map((lib: Library) =>
			fetch(`${baseUrl}/api/libraries/${lib.id}/items?limit=0`, { headers })
				.then((res) => (res.ok ? res.json() : null))
				.then((data) => ({
					libraryId: lib.id,
					libraryName: lib.name,
					total: data?.total || 0,
					items: data?.results || [],
				}))
				.catch(() => ({
					libraryId: lib.id,
					libraryName: lib.name,
					total: 0,
					items: [],
				})),
		);

		const libraryItemsData = await Promise.all(libraryItemsPromises);

		const libraryDetails = libraryItemsData.map((lib) => ({
			id: lib.libraryId,
			name: lib.libraryName,
			total: lib.total,
		}));

		const totalBooks = libraryDetails.reduce((sum, lib) => sum + lib.total, 0);

		const itemsWithCovers: Record<string, unknown> = {};
		for (const lib of libraryItemsData) {
			for (const item of lib.items) {
				const metadata = item.media?.metadata || {};
				const listeningStatsItem = listeningStatsData.items?.[item.id];

				const transformedMetadata: Record<string, unknown> = { ...metadata };

				if (metadata.authorName) {
					transformedMetadata.authors = [{ name: metadata.authorName }];
				}

				if (metadata.seriesName) {
					transformedMetadata.series = [{ name: metadata.seriesName }];
				}

				itemsWithCovers[item.id] = {
					id: item.id,
					timeListening: listeningStatsItem?.timeListening || 0,
					mediaMetadata: transformedMetadata,
					coverUrl: `${baseUrl}/api/items/${item.id}/cover`,
				};
			}
		}

		const mediaProgress = authorizeData.user?.mediaProgress || [];

		const formattedData = {
			totalTime: listeningStatsData.totalTime || 0,
			totalItems: Object.keys(listeningStatsData.items || {}).length,
			totalBooks: totalBooks,
			libraries: libraryDetails,
			items: itemsWithCovers,
			today: listeningStatsData.today || 0,
			recentSessions: listeningStatsData.recentSessions || [],
			mediaProgress: mediaProgress,
			user: {
				username: authorizeData.user?.username,
				isActive: authorizeData.user?.isActive,
				lastSeen: authorizeData.user?.lastSeen,
				createdAt: authorizeData.user?.createdAt,
			},
		};

		cachedData = formattedData;
		cacheTimestamp = now;

		return Response.json(formattedData);
	} catch (error) {
		return Response.json(
			{
				error: "Failed to fetch Audiobookshelf listening stats",
				details: (error as Error).message,
			},
			{ status: 500 },
		);
	}
}

export { handler, routeDef };
