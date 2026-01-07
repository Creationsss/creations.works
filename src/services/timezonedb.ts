import { echo } from "@atums/echo";
import { timezoneDB } from "#environment";
import { normalizeUrl } from "#utils/url";
import { CachedService } from "./base-cache";

class TimezoneService extends CachedService<TimezoneData> {
	protected async fetchData(): Promise<TimezoneData | null> {
		if (!timezoneDB.url || !timezoneDB.id) {
			echo.warn("TimezoneDB not configured, skipping timezone cache");
			return null;
		}

		const baseUrl = normalizeUrl(timezoneDB.url);
		const apiUrl = `${baseUrl}/get?id=${encodeURIComponent(timezoneDB.id)}`;

		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error(`API responded with status ${response.status}`);
		}

		return await response.json();
	}

	protected getServiceName(): string {
		return "timezone data";
	}
}

const timezoneService = new TimezoneService();

export function getCachedTimezone(): TimezoneData | null {
	return timezoneService.getCache();
}

export function startTimezoneCache(): void {
	timezoneService.start();
}
