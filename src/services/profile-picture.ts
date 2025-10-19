import { echo } from "@atums/echo";
import { CachedService } from "./base-cache";

class ProfilePictureService extends CachedService<ArrayBuffer> {
	protected async fetchData(): Promise<ArrayBuffer | null> {
		const imageUrl =
			"https://heliopolis.live/creations/creations/-/raw/main/assets/pfp.png";

		const response = await fetch(imageUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.status}`);
		}

		return await response.arrayBuffer();
	}

	protected getServiceName(): string {
		return "profile picture";
	}

	protected logCacheSuccess(): void {
		if (this.cache) {
			const sizeKB = (this.cache.byteLength / 1024).toFixed(2);
			echo.debug(`Profile picture cached successfully (${sizeKB} KB)`);
		}
	}
}

const profilePictureService = new ProfilePictureService();

export function getCachedImage(): ArrayBuffer | null {
	return profilePictureService.getCache();
}

export function startPfpCache(): void {
	profilePictureService.start();
}
