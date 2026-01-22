import { CONTENT_TYPE } from "#constants";
import { getCachedNowPlaying } from "#services/lastfm";
import { handleCachedJSONResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.JSON,
};

async function handler(): Promise<Response> {
	const cachedNowPlaying = getCachedNowPlaying();
	return handleCachedJSONResponse(cachedNowPlaying, "Last.fm now playing");
}

export { handler, routeDef };
