import { CONTENT_TYPE } from "#constants";
import { getCachedMAL } from "#services/myanimelist";
import { handleCachedJSONResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.JSON,
};

async function handler(): Promise<Response> {
	const cachedMAL = getCachedMAL();
	return handleCachedJSONResponse(cachedMAL, "MAL stats");
}

export { handler, routeDef };
