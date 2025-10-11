import { echo } from "@atums/echo";
import { environment, gitlab } from "#environment";
import { CACHE_DURATION } from "#environment/constants";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

let cachedData: object | null = null;
let cacheTimestamp = 0;

async function handler(): Promise<Response> {
	const now = Date.now();

	if (
		cachedData &&
		cacheTimestamp &&
		now - cacheTimestamp < CACHE_DURATION &&
		!environment.development
	) {
		return Response.json(cachedData);
	}

	if (!gitlab.instanceUrl || !gitlab.token || gitlab.namespaces.length === 0) {
		return Response.json(
			{ error: "GitLab service unavailable" },
			{ status: 503 },
		);
	}

	try {
		let baseUrl = gitlab.instanceUrl;

		if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
			baseUrl = `https://${baseUrl}`;
		}

		baseUrl = baseUrl.replace(/\/$/, "");

		const token = gitlab.token as string;

		const projectPromises = gitlab.namespaces.map(async (namespace) => {
			const namespaceType = namespace.type === "group" ? "groups" : "users";
			const apiUrl = `${baseUrl}/api/v4/${namespaceType}/${encodeURIComponent(namespace.id)}/projects?per_page=100&order_by=last_activity_at&sort=desc`;

			echo.debug(`Fetching projects from: ${apiUrl}`);

			const response = await fetch(apiUrl, {
				headers: {
					"PRIVATE-TOKEN": token,
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
				echo.error({
					message: "GitLab API Error",
					error: {
						status: response.status,
						statusText: response.statusText,
						url: apiUrl,
						response: errorText,
					},
				});
				throw new Error(
					`GitLab API responded with status ${response.status}: ${errorText}`,
				);
			}

			return (await response.json()) as GitLabProject[];
		});

		const projectArrays = await Promise.all(projectPromises);
		const allProjects: GitLabProject[] = projectArrays.flat();

		allProjects.sort((a, b) => {
			const dateA = new Date(a.last_activity_at).getTime();
			const dateB = new Date(b.last_activity_at).getTime();
			return dateB - dateA;
		});

		const projects = allProjects.filter(
			(project) => !gitlab.ignoreNames.includes(project.name),
		);

		echo.debug(
			`Fetched ${allProjects.length} projects from ${gitlab.namespaces.length} GitLab namespace(s)`,
		);

		if (gitlab.ignoreNames.length > 0) {
			echo.debug(
				`Filtered out ${allProjects.length - projects.length} ignored projects`,
			);
		}

		if (projects.length === 0) {
			echo.debug(
				"No projects to display. Check if namespaces are correct and have projects.",
			);
		}

		const projectsWithLanguages = await Promise.all(
			projects.map(async (project) => {
				try {
					const languagesUrl = `${baseUrl}/api/v4/projects/${project.id}/languages`;
					const langResponse = await fetch(languagesUrl, {
						headers: {
							"PRIVATE-TOKEN": token,
						},
					});

					if (langResponse.ok) {
						const languages: Record<string, number> = await langResponse.json();
						const topLanguages = Object.keys(languages)
							.sort((a, b) => (languages[b] ?? 0) - (languages[a] ?? 0))
							.slice(0, 3);
						return { ...project, detectedLanguages: topLanguages };
					}
				} catch (_error) {
					echo.warn(`Failed to fetch languages for project ${project.name}`);
				}
				return { ...project, detectedLanguages: [] };
			}),
		);

		const formattedProjects: ProjectResponse[] = projectsWithLanguages.map(
			(project) => {
				const links: Array<{ text: string; url: string }> = [
					{
						text: "Source Code",
						url: project.web_url,
					},
				];

				const technologies = [
					...(project.topics || []),
					...(project.detectedLanguages || []),
				];
				const uniqueTechnologies = [...new Set(technologies)];

				return {
					name: project.name,
					description: project.description || "No description available",
					sourceUrl: project.web_url,
					technologies: uniqueTechnologies,
					links,
					stats: {
						stars: project.star_count || 0,
						forks: project.forks_count || 0,
						issues: project.open_issues_count || 0,
					},
				};
			},
		);

		const data = { projects: formattedProjects };
		cachedData = data;
		cacheTimestamp = now;

		return Response.json(data);
	} catch (error) {
		echo.error({
			message: "Failed to fetch projects from GitLab",
			error: error as Error,
		});
		return Response.json(
			{
				error: "Failed to fetch projects from GitLab",
				details: (error as Error).message,
			},
			{ status: 500 },
		);
	}
}

export { handler, routeDef };
