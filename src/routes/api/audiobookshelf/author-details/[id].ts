import { audiobookshelf } from "#environment";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
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
		const authorUrl = `${baseUrl}/api/authors/${authorId}`;

		const response = await fetch(authorUrl, { headers });

		if (!response.ok) {
			return new Response("Author not found", { status: 404 });
		}

		const authorData = await response.json();

		return Response.json({
			id: authorData.id,
			name: authorData.name,
			description: authorData.description || null,
		});
	} catch {
		return new Response("Failed to fetch author details", { status: 500 });
	}
}

export { handler, routeDef };
