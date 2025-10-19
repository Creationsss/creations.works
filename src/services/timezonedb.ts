import { echo } from "@atums/echo";
import { timezoneDB } from "#environment";

let cachedTimezone: object | null = null;

async function fetchAndCacheTimezone() {
	if (!timezoneDB.url || !timezoneDB.id) {
		echo.warn("TimezoneDB not configured, skipping timezone cache");
		return;
	}

	try {
		echo.debug("Fetching timezone data from TimezoneDB...");

		const baseUrl = timezoneDB.url.startsWith("http")
			? timezoneDB.url
			: `https://${timezoneDB.url}`;

		const apiUrl = `${baseUrl}/get?id=${encodeURIComponent(timezoneDB.id)}`;

		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`API responded with status ${response.status}`);
		}

		const data = await response.json();

		cachedTimezone = data;
		echo.debug("Timezone data cached successfully");
	} catch (error) {
		echo.error("Failed to fetch timezone data:", error);
	}
}

function getCachedTimezone(): object | null {
	return cachedTimezone;
}

function startTimezoneCache() {
	fetchAndCacheTimezone();

	setInterval(fetchAndCacheTimezone, 60 * 60 * 1000);
}

export { getCachedTimezone, startTimezoneCache };
