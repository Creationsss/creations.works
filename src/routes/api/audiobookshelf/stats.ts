import { audiobookshelf } from "#environment";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

let cachedData: object | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 60 * 1000;

async function handler(): Promise<Response> {
	const now = Date.now();

	if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
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

		const libraryDetailsPromises = librariesData.libraries
			.filter((lib: Library) => lib.mediaType === "book")
			.map((lib: Library) =>
				fetch(`${baseUrl}/api/libraries/${lib.id}/items?limit=1`, { headers })
					.then((res) => (res.ok ? res.json() : null))
					.then((data) => ({
						id: lib.id,
						name: lib.name,
						total: data?.total || 0,
					}))
					.catch(() => ({ id: lib.id, name: lib.name, total: 0 })),
			);

		const libraryDetails = await Promise.all(libraryDetailsPromises);
		const totalBooks = libraryDetails.reduce((sum, lib) => sum + lib.total, 0);

		const itemsWithCovers = Object.fromEntries(
			Object.entries(listeningStatsData.items || {}).map(([id, item]) => [
				id,
				{
					...(item as Record<string, unknown>),
					coverUrl: `${baseUrl}/api/items/${id}/cover`,
				},
			]),
		);

		const formattedData = {
			totalTime: listeningStatsData.totalTime || 0,
			totalItems: Object.keys(listeningStatsData.items || {}).length,
			totalBooks: totalBooks,
			libraries: libraryDetails,
			items: itemsWithCovers,
			today: listeningStatsData.today || 0,
			recentSessions: listeningStatsData.recentSessions || [],
			mediaProgress: authorizeData.user?.mediaProgress || [],
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
