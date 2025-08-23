import { environment, timezoneDB } from "#environment";
import { CACHE_DURATION } from "#environment/constants";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

let cachedData: object | null = null;
let cacheTimestamp = 0;

async function handler(): Promise<Response> {
	const now = Date.now();

	if (
		cachedData &&
		cacheTimestamp &&
		now - cacheTimestamp < CACHE_DURATION &&
		!environment.development
	) {
		return Response.json(cachedData);
	}

	if (!timezoneDB.url || !timezoneDB.id) {
		return Response.json(
			{ error: "TimezoneDB service unavailable" },
			{ status: 503 },
		);
	}

	try {
		const baseUrl = timezoneDB.url.startsWith("http")
			? timezoneDB.url
			: `https://${timezoneDB.url}`;

		const apiUrl = `${baseUrl}/get?id=${encodeURIComponent(timezoneDB.id)}`;

		const response = await fetch(apiUrl);

		if (!response.ok) {
			if (response.status === 404) {
				return Response.json({ error: "User not found" }, { status: 404 });
			}
			throw new Error(`API responded with status ${response.status}`);
		}

		const data = await response.json();

		cachedData = data;
		cacheTimestamp = now;

		return Response.json(data);
	} catch (error) {
		return Response.json(
			{
				error: "Failed to fetch timezone data",
				details: (error as Error).message,
			},
			{ status: 500 },
		);
	}
}

export { handler, routeDef };
