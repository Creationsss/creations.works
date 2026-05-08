import { echo } from "@atums/echo";
import { audiobookshelf } from "#environment";
import { normalizeUrl } from "#utils/url";
import { CachedService } from "./base-cache";

class AudiobookshelfService extends CachedService<AudiobookshelfStats> {
	protected getServiceName(): string {
		return "Audiobookshelf books";
	}

	protected async fetchData(): Promise<AudiobookshelfStats | null> {
		if (!audiobookshelf.url || !audiobookshelf.token) {
			return null;
		}

		try {
			const baseUrl = normalizeUrl(audiobookshelf.url);
			const headers = { Authorization: `Bearer ${audiobookshelf.token}` };

			const [listeningStatsResponse, authorizeResponse, librariesResponse] =
				await Promise.all([
					fetch(`${baseUrl}/api/me/listening-stats`, { headers }),
					fetch(`${baseUrl}/api/authorize`, { headers, method: "POST" }),
					fetch(`${baseUrl}/api/libraries`, { headers }),
				]);

			if (!listeningStatsResponse.ok) {
				echo.warn(
					`Audiobookshelf listening stats API error: ${listeningStatsResponse.status}`,
				);
				return null;
			}

			if (!authorizeResponse.ok) {
				echo.warn(
					`Audiobookshelf authorize API error: ${authorizeResponse.status}`,
				);
				return null;
			}

			if (!librariesResponse.ok) {
				echo.warn(
					`Audiobookshelf libraries API error: ${librariesResponse.status}`,
				);
				return null;
			}

			const listeningStatsData = await listeningStatsResponse.json();
			const authorizeData = await authorizeResponse.json();
			const librariesData: LibrariesResponse = await librariesResponse.json();

			const allowedLibraries = librariesData.libraries.filter(
				(lib: Library) => {
					if (lib.mediaType !== "book") return false;
					if (
						audiobookshelf.libraryIds.length > 0 &&
						!audiobookshelf.libraryIds.includes(lib.id)
					) {
						return false;
					}
					return true;
				},
			);

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

			const libraryDetails: LibraryDetail[] = libraryItemsData.map((lib) => ({
				id: lib.libraryId,
				name: lib.libraryName,
				total: lib.total,
			}));

			const totalBooks = libraryDetails.reduce(
				(sum, lib) => sum + lib.total,
				0,
			);

			const itemsWithCovers: Record<string, unknown> = {};
			for (const lib of libraryItemsData) {
				for (const item of lib.items) {
					const metadata = item.media?.metadata || {};
					const listeningStatsItem = listeningStatsData.items?.[item.id];

					const transformedMetadata: Record<string, unknown> = {
						...metadata,
						duration: item.media?.duration ?? metadata.duration,
					};

					if (!Array.isArray(metadata.authors) && metadata.authorName) {
						transformedMetadata.authors = String(metadata.authorName)
							.split(",")
							.map((name: string) => name.trim())
							.filter((name: string) => name.length > 0)
							.map((name: string) => ({ name }));
					}

					if (
						(!Array.isArray(metadata.series) || metadata.series.length === 0) &&
						metadata.seriesName
					) {
						transformedMetadata.series = String(metadata.seriesName)
							.split(",")
							.map((entry: string) => entry.trim())
							.filter((entry: string) => entry.length > 0)
							.map((entry: string) => {
								const match = entry.match(/^(.*?)\s+#([\d.]+)$/);
								if (match?.[1] && match[2]) {
									return { name: match[1].trim(), sequence: match[2] };
								}
								return { name: entry };
							});
					}

					itemsWithCovers[item.id] = {
						id: item.id,
						timeListening: listeningStatsItem?.timeListening || 0,
						mediaMetadata: transformedMetadata,
						coverUrl: `/api/audiobookshelf/cover/${item.id}`,
					};
				}
			}

			const rawMediaProgress = authorizeData.user?.mediaProgress || [];
			const mediaProgress = Array.isArray(rawMediaProgress)
				? rawMediaProgress.filter((p: { mediaItemType?: string }) => {
						if (!p) return false;
						if (p.mediaItemType && p.mediaItemType !== "book") return false;
						return true;
					})
				: [];

			const rawRecentSessions = listeningStatsData.recentSessions || [];
			const recentSessions = Array.isArray(rawRecentSessions)
				? rawRecentSessions.filter(
						(s: { mediaType?: string }) =>
							!s?.mediaType || s.mediaType === "book",
					)
				: [];

			const days =
				listeningStatsData.days && typeof listeningStatsData.days === "object"
					? (listeningStatsData.days as Record<string, number>)
					: {};

			return {
				totalTime: listeningStatsData.totalTime || 0,
				totalItems: Object.keys(listeningStatsData.items || {}).length,
				totalBooks: totalBooks,
				libraries: libraryDetails,
				items: itemsWithCovers,
				today: listeningStatsData.today || 0,
				days: days,
				recentSessions: recentSessions,
				mediaProgress: mediaProgress,
				user: {
					username: authorizeData.user?.username,
					isActive: authorizeData.user?.isActive,
					lastSeen: authorizeData.user?.lastSeen,
					createdAt: authorizeData.user?.createdAt,
				},
			};
		} catch (error) {
			echo.warn("Audiobookshelf request failed:", error);
			return null;
		}
	}

	public override start(): void {
		if (!audiobookshelf.url || !audiobookshelf.token) {
			echo.warn("Audiobookshelf not configured, skipping books cache");
			return;
		}
		super.start();
	}

	protected logCacheSuccess(): void {
		if (this.cache) {
			echo.debug(
				`Books cached successfully (${this.cache.totalBooks} books, ${this.cache.mediaProgress.length} in progress)`,
			);
		}
	}
}

const audiobookshelfService = new AudiobookshelfService();

function getCachedBooks(): AudiobookshelfStats | null {
	return audiobookshelfService.getCache();
}

function startBooksCache(): void {
	audiobookshelfService.start();
}

export { getCachedBooks, startBooksCache };
