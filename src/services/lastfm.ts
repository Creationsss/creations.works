import { echo } from "@atums/echo";
import { lastFm } from "#environment";
import { CachedService } from "./base-cache";

const LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/";
const POLL_INTERVAL = 30 * 1000;

class LastFmService extends CachedService<NowPlayingData> {
	protected async fetchData(): Promise<NowPlayingData | null> {
		if (!lastFm.apiKey || !lastFm.username) {
			return null;
		}

		try {
			const params = new URLSearchParams({
				method: "user.getrecenttracks",
				user: lastFm.username,
				api_key: lastFm.apiKey,
				format: "json",
				limit: "1",
			});

			const response = await fetch(`${LASTFM_API_URL}?${params}`);

			if (!response.ok) {
				echo.warn(`Last.fm API error: ${response.status}`);
				return null;
			}

			const data = (await response.json()) as LastFmResponse;
			const tracks = data.recenttracks?.track;

			if (!tracks || tracks.length === 0) {
				return { isPlaying: false, track: null };
			}

			const currentTrack = tracks[0];
			if (!currentTrack) {
				return { isPlaying: false, track: null };
			}

			const isPlaying = currentTrack["@attr"]?.nowplaying === "true";

			if (!isPlaying) {
				return { isPlaying: false, track: null };
			}

			const image = currentTrack.image?.find((img) => img.size === "large");

			return {
				isPlaying: true,
				track: {
					name: currentTrack.name,
					artist: currentTrack.artist["#text"],
					album: currentTrack.album?.["#text"] || null,
					image: image?.["#text"] || null,
					url: currentTrack.url,
				},
			};
		} catch (error) {
			echo.warn("Last.fm request failed:", error);
			return null;
		}
	}

	protected getServiceName(): string {
		return "Last.fm";
	}

	protected override getCacheInterval(): number {
		return POLL_INTERVAL;
	}

	public override start(): void {
		if (!lastFm.apiKey || !lastFm.username) {
			echo.warn("Last.fm not configured, skipping cache");
			return;
		}
		super.start();
	}
}

const lastFmService = new LastFmService();

export function getCachedNowPlaying(): NowPlayingData | null {
	return lastFmService.getCache();
}

export function startLastFmCache(): void {
	lastFmService.start();
}
