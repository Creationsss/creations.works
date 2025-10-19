import { echo } from "@atums/echo";

let cachedImageBuffer: ArrayBuffer | null = null;

async function fetchAndCacheImage() {
	try {
		echo.debug("Fetching profile picture from GitLab...");
		const imageUrl =
			"https://heliopolis.live/creations/creations/-/raw/main/assets/pfp.png";

		const response = await fetch(imageUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.status}`);
		}

		const imageBuffer = await response.arrayBuffer();
		cachedImageBuffer = imageBuffer;
		echo.debug(
			`Profile picture cached successfully (${(imageBuffer.byteLength / 1024).toFixed(2)} KB)`,
		);
	} catch (error) {
		echo.error("Failed to fetch profile picture:", error);
	}
}

function getCachedImage(): ArrayBuffer | null {
	return cachedImageBuffer;
}

function startPfpCache() {
	fetchAndCacheImage();

	setInterval(fetchAndCacheImage, 60 * 60 * 1000);
}

export { getCachedImage, startPfpCache };
