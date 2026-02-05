import { CONTENT_TYPE } from "#constants";
import { getCachedListening } from "#services/audiobookshelf-listening";
import { handleCachedJSONResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.JSON,
};

async function handler(): Promise<Response> {
	const cachedListening = getCachedListening();
	return handleCachedJSONResponse(
		cachedListening,
		"Audiobookshelf listening status",
	);
}

export { handler, routeDef };
