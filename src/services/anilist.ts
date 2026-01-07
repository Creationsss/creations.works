import { echo } from "@atums/echo";
import { aniList } from "#environment";
import { CachedService } from "./base-cache";

const ANILIST_API = "https://graphql.anilist.co";

const USER_QUERY = `
query ($username: String) {
  User(name: $username) {
    id
    name
    avatar {
      large
      medium
    }
    createdAt
    statistics {
      anime {
        count
        meanScore
        standardDeviation
        minutesWatched
        episodesWatched
        statuses {
          status
          count
        }
      }
    }
  }
}
`;

const ANIME_LIST_QUERY = `
query ($username: String, $status: MediaListStatus) {
  MediaListCollection(userName: $username, type: ANIME, status: $status, sort: UPDATED_TIME_DESC) {
    lists {
      entries {
        id
        mediaId
        status
        score
        progress
        startedAt {
          year
          month
          day
        }
        completedAt {
          year
          month
          day
        }
        updatedAt
        media {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
            large
            medium
          }
          bannerImage
          format
          status
          episodes
          duration
          season
          seasonYear
          averageScore
          meanScore
          genres
          description(asHtml: false)
        }
      }
    }
  }
}
`;

async function graphqlRequest<T>(
	query: string,
	variables: Record<string, unknown>,
): Promise<T | null> {
	try {
		const response = await fetch(ANILIST_API, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ query, variables }),
		});

		if (!response.ok) {
			echo.warn(`AniList API error: ${response.status}`);
			return null;
		}

		const json = (await response.json()) as { data: T; errors?: unknown[] };

		if (json.errors) {
			echo.warn("AniList GraphQL errors:", json.errors);
			return null;
		}

		return json.data;
	} catch (error) {
		echo.warn("AniList request failed:", error);
		return null;
	}
}

class AniListService extends CachedService<AniListData> {
	protected async fetchData(): Promise<AniListData | null> {
		if (!aniList.username) {
			echo.warn("AniList username not configured, skipping cache");
			return null;
		}

		try {
			const [userResult, watching, completed, onHold, dropped, planToWatch] =
				await Promise.all([
					graphqlRequest<{ User: AniListUser }>(USER_QUERY, {
						username: aniList.username,
					}),
					this.fetchList("CURRENT"),
					this.fetchList("COMPLETED"),
					this.fetchList("PAUSED"),
					this.fetchList("DROPPED"),
					this.fetchList("PLANNING"),
				]);

			const user = userResult?.User || null;
			const stats = user?.statistics?.anime;

			const getStatusCount = (status: string): number => {
				return (
					stats?.statuses?.find(
						(s: { status: string; count: number }) => s.status === status,
					)?.count || 0
				);
			};

			return {
				user,
				watching,
				completed,
				onHold,
				dropped,
				planToWatch,
				statistics: {
					totalAnime: stats?.count || 0,
					totalEpisodes: stats?.episodesWatched || 0,
					daysWatched: Math.round((stats?.minutesWatched || 0) / 1440),
					meanScore: stats?.meanScore || 0,
					watching: getStatusCount("CURRENT"),
					completed: getStatusCount("COMPLETED"),
					onHold: getStatusCount("PAUSED"),
					dropped: getStatusCount("DROPPED"),
					planToWatch: getStatusCount("PLANNING"),
				},
			};
		} catch (error) {
			echo.error("Failed to fetch AniList data:", error);
			return null;
		}
	}

	private async fetchList(status: string): Promise<AniListEntry[]> {
		const result = await graphqlRequest<{
			MediaListCollection: {
				lists: Array<{ entries: AniListEntry[] }>;
			};
		}>(ANIME_LIST_QUERY, {
			username: aniList.username,
			status,
		});

		if (!result?.MediaListCollection?.lists?.[0]?.entries) {
			return [];
		}

		return result.MediaListCollection.lists[0].entries;
	}

	protected getServiceName(): string {
		return "AniList";
	}

	protected logCacheSuccess(): void {
		if (this.cache) {
			echo.debug(
				`AniList cached successfully (${this.cache.statistics.totalAnime} anime, ${this.cache.statistics.watching} watching)`,
			);
		}
	}
}

const aniListService = new AniListService();

export function getCachedAniList(): AniListData | null {
	return aniListService.getCache();
}

export function startAniListCache(): void {
	aniListService.start();
}
