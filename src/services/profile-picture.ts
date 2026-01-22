import { echo } from "@atums/echo";
import { siteImages } from "#environment";
import { CachedService } from "./base-cache";

type ThemeImages = {
	light: ArrayBuffer | null;
	dark: ArrayBuffer | null;
};

class ProfilePictureService extends CachedService<ThemeImages> {
	protected async fetchData(): Promise<ThemeImages | null> {
		const result: ThemeImages = { light: null, dark: null };

		if (siteImages.profilePicture.light) {
			try {
				const response = await fetch(siteImages.profilePicture.light);
				if (response.ok) {
					result.light = await response.arrayBuffer();
				}
			} catch (error) {
				echo.warn(`Failed to fetch light profile picture: ${error}`);
			}
		}

		if (siteImages.profilePicture.dark) {
			try {
				const response = await fetch(siteImages.profilePicture.dark);
				if (response.ok) {
					result.dark = await response.arrayBuffer();
				}
			} catch (error) {
				echo.warn(`Failed to fetch dark profile picture: ${error}`);
			}
		}

		if (!result.light && !result.dark) {
			return null;
		}

		return result;
	}

	protected getServiceName(): string {
		return "profile picture";
	}

	protected logCacheSuccess(): void {
		if (this.cache) {
			const lightSize = this.cache.light
				? (this.cache.light.byteLength / 1024).toFixed(2)
				: "0";
			const darkSize = this.cache.dark
				? (this.cache.dark.byteLength / 1024).toFixed(2)
				: "0";
			echo.debug(
				`Profile pictures cached (light: ${lightSize} KB, dark: ${darkSize} KB)`,
			);
		}
	}
}

class BackgroundImageService extends CachedService<ThemeImages> {
	protected async fetchData(): Promise<ThemeImages | null> {
		const result: ThemeImages = { light: null, dark: null };

		if (siteImages.background.light) {
			try {
				const response = await fetch(siteImages.background.light);
				if (response.ok) {
					result.light = await response.arrayBuffer();
				}
			} catch (error) {
				echo.warn(`Failed to fetch light background image: ${error}`);
			}
		}

		if (siteImages.background.dark) {
			try {
				const response = await fetch(siteImages.background.dark);
				if (response.ok) {
					result.dark = await response.arrayBuffer();
				}
			} catch (error) {
				echo.warn(`Failed to fetch dark background image: ${error}`);
			}
		}

		if (!result.light && !result.dark) {
			return null;
		}

		return result;
	}

	protected getServiceName(): string {
		return "background image";
	}

	protected logCacheSuccess(): void {
		if (this.cache) {
			const lightSize = this.cache.light
				? (this.cache.light.byteLength / 1024).toFixed(2)
				: "0";
			const darkSize = this.cache.dark
				? (this.cache.dark.byteLength / 1024).toFixed(2)
				: "0";
			echo.debug(
				`Background images cached (light: ${lightSize} KB, dark: ${darkSize} KB)`,
			);
		}
	}
}

const profilePictureService = new ProfilePictureService();
const backgroundImageService = new BackgroundImageService();

export function getCachedProfilePicture(
	theme: "light" | "dark",
): ArrayBuffer | null {
	const cache = profilePictureService.getCache();
	if (!cache) return null;
	return cache[theme] || cache.light || cache.dark;
}

export function getCachedBackgroundImage(
	theme: "light" | "dark",
): ArrayBuffer | null {
	const cache = backgroundImageService.getCache();
	if (!cache) return null;
	return cache[theme] || cache.light || cache.dark;
}

export function startImageCaches(): void {
	profilePictureService.start();
	backgroundImageService.start();
}
