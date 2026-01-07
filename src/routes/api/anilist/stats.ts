import { CONTENT_TYPE } from "#constants";
import { getCachedAniList } from "#services/anilist";
import { handleCachedJSONResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.JSON,
};

async function handler(): Promise<Response> {
	const cachedAniList = getCachedAniList();
	return handleCachedJSONResponse(cachedAniList, "AniList stats");
}

export { handler, routeDef };
