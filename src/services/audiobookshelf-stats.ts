import { echo } from "@atums/echo";
import { audiobookshelf } from "#environment";
import { normalizeUrl } from "#utils/url";

export type BooksData = {
	totalTime: number;
	totalItems: number;
	totalBooks: number;
	libraries: unknown[];
	items: Record<string, unknown>;
	[key: string]: unknown;
};

let cachedBooks: object | null = null;

async function fetchAndCacheBooks() {
	if (!audiobookshelf.url || !audiobookshelf.token) {
		echo.warn("Audiobookshelf not configured, skipping books cache");
		return;
	}

	try {
		echo.debug("Fetching books from Audiobookshelf...");

		const baseUrl = normalizeUrl(audiobookshelf.url);

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

		cachedBooks = formattedData;
		echo.debug(
			`Books cached successfully (${totalBooks} books, ${mediaProgress.length} in progress)`,
		);
	} catch (error) {
		echo.error("Failed to fetch books from Audiobookshelf:", error);
	}
}

function getCachedBooks(): object | null {
	return cachedBooks;
}

function startBooksCache() {
	fetchAndCacheBooks();

	setInterval(fetchAndCacheBooks, 60 * 60 * 1000);
}

export { getCachedBooks, startBooksCache };
