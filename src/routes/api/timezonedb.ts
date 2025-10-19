import { getCachedTimezone } from "#services/timezonedb";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function handler(): Promise<Response> {
	const cachedTimezone = getCachedTimezone();

	if (!cachedTimezone) {
		return Response.json(
			{ error: "Timezone data not available yet" },
			{ status: 503 },
		);
	}

	return Response.json(cachedTimezone);
}

export { handler, routeDef };
