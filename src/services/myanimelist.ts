import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { echo } from "@atums/echo";
import { myAnimeList } from "#environment";
import { CachedService } from "./base-cache";

const MAL_API_BASE = "https://api.myanimelist.net/v2";
const MAL_TOKEN_URL = "https://myanimelist.net/v1/oauth2/token";
const TOKEN_FILE = resolve("data", "mal-tokens.json");

interface TokenData {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
}

function loadTokens(): TokenData | null {
	try {
		if (existsSync(TOKEN_FILE)) {
			const data = JSON.parse(readFileSync(TOKEN_FILE, "utf-8"));
			return data as TokenData;
		}
	} catch (error) {
		echo.warn("Failed to load MAL tokens from file:", error);
	}

	if (myAnimeList.accessToken && myAnimeList.refreshToken) {
		return {
			accessToken: myAnimeList.accessToken,
			refreshToken: myAnimeList.refreshToken,
			expiresAt: 0,
		};
	}

	return null;
}

function saveTokens(tokens: TokenData): void {
	try {
		const dir = resolve("data");
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
		echo.debug("MAL tokens saved successfully");
	} catch (error) {
		echo.error("Failed to save MAL tokens:", error);
	}
}

async function refreshAccessToken(
	refreshToken: string,
): Promise<TokenData | null> {
	if (!myAnimeList.clientId || !myAnimeList.clientSecret) {
		echo.error("MAL client credentials not configured");
		return null;
	}

	try {
		const response = await fetch(MAL_TOKEN_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: myAnimeList.clientId,
				client_secret: myAnimeList.clientSecret,
				grant_type: "refresh_token",
				refresh_token: refreshToken,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			echo.error(`Failed to refresh MAL token: ${response.status} - ${error}`);
			return null;
		}

		const data = (await response.json()) as {
			access_token: string;
			refresh_token: string;
			expires_in: number;
		};

		const tokens: TokenData = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: Date.now() + data.expires_in * 1000,
		};

		saveTokens(tokens);
		echo.info("MAL tokens refreshed successfully");

		return tokens;
	} catch (error) {
		echo.error("Error refreshing MAL token:", error);
		return null;
	}
}

class MyAnimeListService extends CachedService<MALData> {
	private tokens: TokenData | null = null;

	public reloadTokens(): void {
		this.tokens = loadTokens();
	}

	private async getValidToken(): Promise<string | null> {
		if (!this.tokens) {
			this.tokens = loadTokens();
		}

		if (!this.tokens) {
			echo.warn("No MAL tokens available");
			return null;
		}

		if (
			this.tokens.expiresAt > 0 &&
			Date.now() >= this.tokens.expiresAt - 60000
		) {
			echo.debug("MAL token expired, refreshing...");
			this.tokens = await refreshAccessToken(this.tokens.refreshToken);
		}

		return this.tokens?.accessToken || null;
	}

	private async getHeaders(): Promise<HeadersInit | null> {
		const token = await this.getValidToken();
		if (!token) return null;

		return {
			Authorization: `Bearer ${token}`,
			"X-MAL-Client-ID": myAnimeList.clientId as string,
		};
	}

	protected async fetchData(): Promise<MALData | null> {
		if (!myAnimeList.clientId || !myAnimeList.clientSecret) {
			echo.warn("MyAnimeList not configured, skipping MAL cache");
			return null;
		}

		const headers = await this.getHeaders();
		if (!headers) {
			echo.warn("No valid MAL token available");
			return null;
		}

		try {
			const [userInfo, watching, completed, onHold, dropped, planToWatch] =
				await Promise.all([
					this.fetchUserInfo(headers),
					this.fetchAnimeList("watching", headers),
					this.fetchAnimeList("completed", headers),
					this.fetchAnimeList("on_hold", headers),
					this.fetchAnimeList("dropped", headers),
					this.fetchAnimeList("plan_to_watch", headers),
				]);

			const stats = userInfo?.anime_statistics;

			return {
				user: userInfo,
				watching,
				completed,
				onHold,
				dropped,
				planToWatch,
				statistics: {
					totalAnime: stats?.num_items || 0,
					totalEpisodes: stats?.num_episodes || 0,
					daysWatched: stats?.num_days || 0,
					meanScore: stats?.mean_score || 0,
					watching: stats?.num_items_watching || 0,
					completed: stats?.num_items_completed || 0,
					onHold: stats?.num_items_on_hold || 0,
					dropped: stats?.num_items_dropped || 0,
					planToWatch: stats?.num_items_plan_to_watch || 0,
				},
			};
		} catch (error) {
			echo.error("Failed to fetch MyAnimeList data:", error);
			return null;
		}
	}

	private async fetchUserInfo(
		headers: HeadersInit,
	): Promise<MALUserInfo | null> {
		try {
			const response = await fetch(
				`${MAL_API_BASE}/users/@me?fields=anime_statistics`,
				{ headers },
			);

			if (!response.ok) {
				if (response.status === 401) {
					echo.warn("MAL token invalid, attempting refresh...");
					if (this.tokens) {
						this.tokens = await refreshAccessToken(this.tokens.refreshToken);
					}
				}
				echo.warn(`MAL user info API error: ${response.status}`);
				return null;
			}

			return (await response.json()) as MALUserInfo;
		} catch (error) {
			echo.warn("Failed to fetch MAL user info:", error);
			return null;
		}
	}

	private async fetchAnimeList(
		status: string,
		headers: HeadersInit,
	): Promise<MALAnimeListItem[]> {
		const allItems: MALAnimeListItem[] = [];
		let nextUrl: string | null =
			`${MAL_API_BASE}/users/@me/animelist?status=${status}&sort=list_updated_at&limit=100&fields=list_status{start_date,finish_date},num_episodes,start_season,mean,status,media_type,synopsis,genres`;

		try {
			while (nextUrl) {
				const response = await fetch(nextUrl, { headers });

				if (!response.ok) {
					echo.warn(`MAL anime list API error: ${response.status}`);
					break;
				}

				const data = (await response.json()) as MALAnimeListResponse;
				allItems.push(...data.data);

				nextUrl = data.paging?.next || null;
			}
		} catch (error) {
			echo.warn(`Failed to fetch MAL ${status} list:`, error);
		}

		return allItems;
	}

	protected getServiceName(): string {
		return "MyAnimeList";
	}

	protected logCacheSuccess(): void {
		if (this.cache) {
			echo.debug(
				`MAL cached successfully (${this.cache.statistics.totalAnime} anime, ${this.cache.statistics.watching} watching)`,
			);
		}
	}
}

const myAnimeListService = new MyAnimeListService();

export function getCachedMAL(): MALData | null {
	return myAnimeListService.getCache();
}

export function startMALCache(): void {
	myAnimeListService.start();
}

export function reloadMALTokens(): void {
	myAnimeListService.reloadTokens();
}
