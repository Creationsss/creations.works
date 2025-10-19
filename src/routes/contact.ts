import { CONTENT_TYPE } from "#constants";
import { createHTMLRouteHandler } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.HTML,
};

const handler = createHTMLRouteHandler("contact.html");

export { handler, routeDef };
