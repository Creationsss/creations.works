import { echo } from "@atums/echo";
import { srsViewer } from "#environment";
import { normalizeUrl } from "#utils/url";
import { CachedService } from "./base-cache";

const POLL_INTERVAL = 30 * 1000;

class SrsViewerService extends CachedService<SrsViewerData> {
	protected getServiceName(): string {
		return "SRS Viewer";
	}

	protected override getCacheInterval(): number {
		return POLL_INTERVAL;
	}

	private async fetchViewerCount(
		baseUrl: string,
		streamId: string,
	): Promise<number> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(
				`${baseUrl}/api/viewers?stream=${encodeURIComponent(streamId)}`,
				{ signal: controller.signal },
			);
			clearTimeout(timeoutId);

			if (!response.ok) return 0;

			const data = await response.json();
			return data?.data?.viewerCount ?? 0;
		} catch {
			return 0;
		}
	}

	protected async fetchData(): Promise<SrsViewerData | null> {
		if (!srsViewer.url || !srsViewer.username) {
			return null;
		}

		try {
			const baseUrl = normalizeUrl(srsViewer.url);

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(`${baseUrl}/api/streams`, {
				signal: controller.signal,
			});
			clearTimeout(timeoutId);

			if (!response.ok) {
				echo.warn(`SRS Viewer API error: ${response.status}`);
				return { isLive: false, streams: [] };
			}

			const data = (await response.json()) as SrsApiResponse;

			if (!data.success || !data.data?.streams) {
				return { isLive: false, streams: [] };
			}

			const activeStreams = data.data.streams.filter(
				(stream) =>
					stream.publish?.active === true && stream.name === srsViewer.username,
			);

			if (activeStreams.length === 0) {
				return { isLive: false, streams: [] };
			}

			const streams: SrsStream[] = await Promise.all(
				activeStreams.map(async (stream) => {
					const viewers = await this.fetchViewerCount(baseUrl, stream.name);

					return {
						name: stream.name,
						app: stream.app,
						viewers,
						watchUrl: `${baseUrl}/watch/${stream.name}`,
						previewUrl: `${baseUrl}/api/preview/${stream.name}`,
					};
				}),
			);

			return {
				isLive: true,
				streams,
			};
		} catch (error) {
			echo.warn("SRS Viewer request failed:", error);
			return { isLive: false, streams: [] };
		}
	}

	public override start(): void {
		if (!srsViewer.url || !srsViewer.username) {
			echo.warn("SRS Viewer not configured, skipping cache");
			return;
		}
		super.start();
	}
}

const srsViewerService = new SrsViewerService();

export function getCachedStreams(): SrsViewerData | null {
	return srsViewerService.getCache();
}

export function startSrsViewerCache(): void {
	srsViewerService.start();
}
