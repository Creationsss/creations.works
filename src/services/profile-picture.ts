import { echo } from "@atums/echo";
import { createHash } from "node:crypto";
import { gravatar } from "#environment";
import { CachedService } from "./base-cache";

class ProfilePictureService extends CachedService<ArrayBuffer> {
	protected async fetchData(): Promise<ArrayBuffer | null> {
		if (!gravatar.email) {
			throw new Error("GRAVATAR_EMAIL is not configured");
		}

		const hash = createHash("md5")
			.update(gravatar.email.trim().toLowerCase())
			.digest("hex");
		const imageUrl = `https://www.gravatar.com/avatar/${hash}?s=512`;

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
