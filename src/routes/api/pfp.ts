import { getCachedImage } from "#services/profile-picture";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "image/png",
};

async function handler(): Promise<Response> {
	const cachedImageBuffer = getCachedImage();

	if (!cachedImageBuffer) {
		return new Response("Profile picture not available yet", {
			status: 503,
			headers: { "Content-Type": "text/plain" },
		});
	}

	return new Response(cachedImageBuffer, {
		headers: {
			"Content-Type": "image/png",
		},
	});
}

export { handler, routeDef };
