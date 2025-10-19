import { CACHE_CONTROL, CONTENT_TYPE } from "#constants";
import { getCachedImage } from "#services/profile-picture";
import { handleCachedBinaryResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.PNG,
};

async function handler(): Promise<Response> {
	const cachedImageBuffer = getCachedImage();
	return handleCachedBinaryResponse(
		cachedImageBuffer,
		"Profile picture",
		CONTENT_TYPE.PNG,
		CACHE_CONTROL.ONE_HOUR,
	);
}

export { handler, routeDef };
