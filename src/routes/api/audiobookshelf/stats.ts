import { CONTENT_TYPE } from "#constants";
import { getCachedBooks } from "#services/audiobookshelf-stats";
import { handleCachedJSONResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.JSON,
};

async function handler(): Promise<Response> {
	const cachedBooks = getCachedBooks();
	return handleCachedJSONResponse(cachedBooks, "Books stats");
}

export { handler, routeDef };
