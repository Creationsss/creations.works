import { echo } from "@atums/echo";
import { AUDIOBOOK } from "#constants";
import { audiobookshelf } from "#environment";
import { normalizeUrl } from "#utils/url";
import { CachedService } from "./base-cache";

class AudiobookshelfListeningService extends CachedService<AudiobookListeningData> {
	protected getServiceName(): string {
		return "Audiobookshelf listening";
	}

	protected override getCacheInterval(): number {
		return AUDIOBOOK.LISTENING_POLL_INTERVAL_MS;
	}

	protected async fetchData(): Promise<AudiobookListeningData | null> {
		if (!audiobookshelf.url || !audiobookshelf.token) {
			return null;
		}

		try {
			const baseUrl = normalizeUrl(audiobookshelf.url);
			const headers = { Authorization: `Bearer ${audiobookshelf.token}` };

			const response = await fetch(`${baseUrl}/api/users/online`, {
				headers,
			});

			if (!response.ok) {
				echo.warn(`Audiobookshelf online users API error: ${response.status}`);
				return { isListening: false, book: null };
			}

			const data = await response.json();
			const sessions = data.openSessions || [];

			if (!Array.isArray(sessions) || sessions.length === 0) {
				return { isListening: false, book: null };
			}

			const now = Date.now();
			const activeSession = sessions.find(
				(s) =>
					s?.mediaType === "book" &&
					s?.libraryItemId &&
					now - (s.updatedAt || 0) <= AUDIOBOOK.LISTENING_STALE_THRESHOLD_MS,
			);

			if (!activeSession) {
				return { isListening: false, book: null };
			}

			const coverUrl = `/api/audiobookshelf/cover/${activeSession.libraryItemId}`;

			const currentTime = activeSession.currentTime || 0;
			const duration = activeSession.duration || 0;
			const progress = duration > 0 ? currentTime / duration : 0;

			return {
				isListening: true,
				book: {
					id: activeSession.libraryItemId,
					title: activeSession.displayTitle || "Unknown Title",
					author: activeSession.displayAuthor || "Unknown Author",
					cover: coverUrl,
					progress,
					currentTime,
					duration,
				},
			};
		} catch (error) {
			echo.warn("Audiobookshelf listening request failed:", error);
			return { isListening: false, book: null };
		}
	}

	public override start(): void {
		if (!audiobookshelf.url || !audiobookshelf.token) {
			echo.warn("Audiobookshelf not configured, skipping listening cache");
			return;
		}
		super.start();
	}
}

const audiobookshelfListeningService = new AudiobookshelfListeningService();

export function getCachedListening(): AudiobookListeningData | null {
	return audiobookshelfListeningService.getCache();
}

export function startAudiobookshelfListeningCache(): void {
	audiobookshelfListeningService.start();
}
