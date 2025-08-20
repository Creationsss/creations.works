import { audiobookshelf } from "#environment";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "*/*",
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const authorId = request.params?.id;

	if (!authorId) {
		return new Response("Author ID required", { status: 400 });
	}

	if (!audiobookshelf.url || !audiobookshelf.token) {
		return new Response("AudioBookshelf not configured", { status: 503 });
	}

	try {
		const baseUrl = audiobookshelf.url.startsWith("http")
			? audiobookshelf.url
			: `https://${audiobookshelf.url}`;

		const headers = { Authorization: `Bearer ${audiobookshelf.token}` };
		const imageUrl = `${baseUrl}/api/authors/${authorId}/image`;

		const response = await fetch(imageUrl, { headers });

		if (!response.ok) {
			return new Response("Image not found", { status: 404 });
		}

		const imageBuffer = await response.arrayBuffer();
		const contentType = response.headers.get("content-type") || "image/jpeg";

		return new Response(imageBuffer, {
			headers: {
				"Content-Type": contentType,
			},
		});
	} catch {
		return new Response("Failed to fetch author image", { status: 500 });
	}
}

export { handler, routeDef };
