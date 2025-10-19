import { CONTENT_TYPE } from "#constants";
import { getCachedProjects } from "#services/gitlab-projects";
import { handleCachedJSONResponse } from "#utils/route-handlers";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.JSON,
};

async function handler(): Promise<Response> {
	const cachedProjects = getCachedProjects();
	return handleCachedJSONResponse(cachedProjects, "Projects");
}

export { handler, routeDef };
