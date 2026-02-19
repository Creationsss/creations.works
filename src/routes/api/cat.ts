import { CACHE_CONTROL, CONTENT_TYPE } from "#constants";
import { getCachedCat } from "#services/cataas";
import { handleCachedBinaryResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.PNG,
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const index = request.query.i
		? Number.parseInt(request.query.i, 10)
		: undefined;
	const cat = getCachedCat(
		index !== undefined && !Number.isNaN(index) ? index : undefined,
	);
	return handleCachedBinaryResponse(
		cat,
		"Cat",
		CONTENT_TYPE.PNG,
		CACHE_CONTROL.ONE_HOUR,
	);
}

export { handler, routeDef };
