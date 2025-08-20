import { resolve } from "node:path";
import { file } from "bun";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "text/html",
};

async function handler(): Promise<Response> {
	const path = resolve("public", "views", "projects.html");
	const bunFile = file(path);

	if (!bunFile) {
		return new Response("Projects page not found", {
			status: 404,
			headers: { "Content-Type": "text/html" },
		});
	}

	return new Response(bunFile.stream(), {
		headers: { "Content-Type": "text/html" },
	});
}

export { handler, routeDef };
