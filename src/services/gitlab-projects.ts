import { echo } from "@atums/echo";
import { API } from "#constants";
import { gitlab } from "#environment";
import { normalizeUrl, removeTrailingSlash } from "#utils/url";
import { CachedService } from "./base-cache";

export type ProjectsData = {
	projects: ProjectResponse[];
};

class GitLabProjectsService extends CachedService<ProjectsData> {
	protected async fetchData(): Promise<ProjectsData | null> {
		if (
			!gitlab.instanceUrl ||
			!gitlab.token ||
			gitlab.namespaces.length === 0
		) {
			echo.warn("GitLab not configured, skipping projects cache");
			return null;
		}

		let baseUrl = normalizeUrl(gitlab.instanceUrl);
		baseUrl = removeTrailingSlash(baseUrl);

		const token = gitlab.token as string;

		const projectPromises = gitlab.namespaces.map(async (namespace) => {
			const namespaceType = namespace.type === "group" ? "groups" : "users";
			const apiUrl = `${baseUrl}/api/v4/${namespaceType}/${encodeURIComponent(namespace.id)}/projects?per_page=${API.GITLAB_ITEMS_PER_PAGE}&order_by=last_activity_at&sort=desc`;

			const response = await fetch(apiUrl, {
				headers: {
					"PRIVATE-TOKEN": token,
				},
			});

			if (!response.ok) {
				const errorText = await response.text();
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
							.slice(0, API.GITLAB_TOP_LANGUAGES);
						return { ...project, detectedLanguages: topLanguages };
					}
				} catch {}
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

		return { projects: formattedProjects };
	}

	protected getServiceName(): string {
		return "GitLab projects";
	}

	protected logCacheSuccess(): void {
		if (this.cache) {
			echo.debug(
				`Projects cached successfully (${this.cache.projects.length} projects)`,
			);
		}
	}
}

const gitLabProjectsService = new GitLabProjectsService();

export function getCachedProjects(): ProjectsData | null {
	return gitLabProjectsService.getCache();
}

export function startProjectsCache(): void {
	gitLabProjectsService.start();
}
