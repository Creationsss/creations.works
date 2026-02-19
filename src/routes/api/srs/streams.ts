import { CONTENT_TYPE } from "#constants";
import { getCachedStreams } from "#services/srs-viewer";
import { handleCachedJSONResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.JSON,
};

async function handler(): Promise<Response> {
	const cachedStreams = getCachedStreams();
	return handleCachedJSONResponse(cachedStreams, "SRS streams");
}

export { handler, routeDef };
