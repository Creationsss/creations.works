import { CONTENT_TYPE } from "#constants";
import { getCachedTimezone } from "#services/timezonedb";
import { handleCachedJSONResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.JSON,
};

async function handler(): Promise<Response> {
	const cachedTimezone = getCachedTimezone();
	return handleCachedJSONResponse(cachedTimezone, "Timezone data");
}

export { handler, routeDef };
