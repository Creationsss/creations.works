import { echo } from "@atums/echo";
import {
	AUDIOBOOK,
	CACHE_CONTROL,
	CONTENT_TYPE,
	HTTP_STATUS,
} from "#constants";
import { audiobookshelf } from "#environment";
import { normalizeUrl } from "#utils/url";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "*/*",
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const id = request.params.id;

	if (!id || !AUDIOBOOK.ITEM_ID_PATTERN.test(id)) {
		return new Response("Not Found", { status: HTTP_STATUS.NOT_FOUND });
	}

	if (!audiobookshelf.url || !audiobookshelf.token) {
		return new Response("Not Found", { status: HTTP_STATUS.NOT_FOUND });
	}

	try {
		const baseUrl = normalizeUrl(audiobookshelf.url);
		const upstream = await fetch(`${baseUrl}/api/items/${id}/cover`, {
			headers: { Authorization: `Bearer ${audiobookshelf.token}` },
		});

		if (!upstream.ok || !upstream.body) {
			return new Response("Not Found", { status: HTTP_STATUS.NOT_FOUND });
		}

		const contentType =
			upstream.headers.get("Content-Type") || CONTENT_TYPE.OCTET_STREAM;

		return new Response(upstream.body, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": CACHE_CONTROL.ONE_HOUR,
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch (error) {
		echo.warn("Audiobookshelf cover proxy failed:", error);
		return new Response("Not Found", { status: HTTP_STATUS.NOT_FOUND });
	}
}

export { handler, routeDef };
