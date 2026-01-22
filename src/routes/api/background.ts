import { CACHE_CONTROL, CONTENT_TYPE } from "#constants";
import { getCachedBackgroundImage } from "#services/profile-picture";
import { handleCachedBinaryResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.PNG,
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const theme = request.query.theme === "dark" ? "dark" : "light";
	const cachedImageBuffer = getCachedBackgroundImage(theme);
	return handleCachedBinaryResponse(
		cachedImageBuffer,
		"Background image",
		CONTENT_TYPE.PNG,
		CACHE_CONTROL.ONE_HOUR,
	);
}

export { handler, routeDef };
