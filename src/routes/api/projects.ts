import { getCachedProjects } from "#services/gitlab-projects";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

async function handler(): Promise<Response> {
	const cachedProjects = getCachedProjects();

	if (!cachedProjects) {
		return Response.json(
			{ error: "Projects not available yet" },
			{ status: 503 },
		);
	}

	return Response.json(cachedProjects);
}

export { handler, routeDef };
