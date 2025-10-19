import { getCachedBooks } from "#services/audiobookshelf-stats";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function handler(): Promise<Response> {
	const cachedBooks = getCachedBooks();

	if (!cachedBooks) {
		return Response.json(
			{ error: "Books stats not available yet" },
			{ status: 503 },
		);
	}

	return Response.json(cachedBooks);
}

export { handler, routeDef };
