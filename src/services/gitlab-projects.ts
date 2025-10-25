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
		const allFormattedProjects: ProjectResponse[] = [];

		if (gitlab.instanceUrl && gitlab.token && gitlab.namespaces.length > 0) {
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
							const languages: Record<string, number> =
								await langResponse.json();
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

					const namespace = project.namespace?.path;
					const displayName = namespace
						? `${namespace}/${project.name}`
						: project.name;
					const isFeatured =
						gitlab.featuredProjects.includes(project.name) ||
						gitlab.featuredProjects.includes(displayName);

					const result: ProjectResponse = {
						name: displayName,
						description: project.description || "",
						sourceUrl: project.web_url,
						technologies: uniqueTechnologies,
						links,
						stats: {
							stars: project.star_count || 0,
							forks: project.forks_count || 0,
							issues: project.open_issues_count || 0,
						},
						featured: isFeatured,
					};
					if (namespace) {
						result.namespace = namespace;
					}
					return result;
				},
			);

			allFormattedProjects.push(...formattedProjects);
		} else {
			echo.warn("GitLab not configured, skipping GitLab projects");
		}

		if (gitlab.externalProjects.length > 0) {
			echo.debug(
				`Fetching ${gitlab.externalProjects.length} external projects...`,
			);
			const externalProjects = await this.fetchExternalProjects();
			echo.debug(`Fetched ${externalProjects.length} external projects`);
			allFormattedProjects.push(...externalProjects);
		} else {
			echo.debug("No external projects configured");
		}

		allFormattedProjects.sort((a, b) => {
			if (a.featured && !b.featured) return -1;
			if (!a.featured && b.featured) return 1;
			return b.stats.stars - a.stats.stars;
		});

		return { projects: allFormattedProjects };
	}

	private async fetchExternalProjects(): Promise<ProjectResponse[]> {
		const projects: ProjectResponse[] = [];

		for (const extProject of gitlab.externalProjects) {
			try {
				echo.debug(`Processing external project: ${extProject.url}`);
				const githubMatch = extProject.url.match(
					/github\.com\/([^/]+)\/([^/]+)/,
				);
				if (!githubMatch || !githubMatch[1] || !githubMatch[2]) {
					echo.warn(`Unsupported external project URL: ${extProject.url}`);
					continue;
				}

				const owner = githubMatch[1];
				const repo = githubMatch[2];
				const cleanRepo = repo.replace(/\.git$/, "");

				const apiUrl = `https://api.github.com/repos/${owner}/${cleanRepo}`;
				echo.debug(`Fetching from GitHub API: ${apiUrl}`);
				const response = await fetch(apiUrl, {
					headers: {
						Accept: "application/vnd.github.v3+json",
						"User-Agent": "creations.works",
					},
				});

				if (!response.ok) {
					echo.warn(
						`Failed to fetch GitHub project: ${extProject.url} (${response.status} ${response.statusText})`,
					);
					continue;
				}

				echo.debug(`Successfully fetched: ${owner}/${cleanRepo}`);

				const data = (await response.json()) as GitHubRepository;

				const languagesResponse = await fetch(`${apiUrl}/languages`, {
					headers: {
						Accept: "application/vnd.github.v3+json",
						"User-Agent": "creations.works",
					},
				});

				let detectedLanguages: string[] = [];
				if (languagesResponse.ok) {
					const languages: Record<string, number> =
						await languagesResponse.json();
					detectedLanguages = Object.keys(languages)
						.sort((a, b) => (languages[b] ?? 0) - (languages[a] ?? 0))
						.slice(0, API.GITLAB_TOP_LANGUAGES);
				}

				const technologies = [
					...(data.topics || []),
					...(detectedLanguages || []),
				];
				const uniqueTechnologies = [...new Set(technologies)];

				const displayName = data.full_name;
				const isFeatured =
					extProject.featured ||
					gitlab.featuredProjects.includes(displayName) ||
					gitlab.featuredProjects.includes(data.name);

				projects.push({
					name: displayName,
					description: data.description || "",
					sourceUrl: data.html_url,
					technologies: uniqueTechnologies,
					links: [
						{
							text: "Source Code",
							url: data.html_url,
						},
					],
					stats: {
						stars: data.stargazers_count || 0,
						forks: data.forks_count || 0,
						issues: data.open_issues_count || 0,
					},
					featured: isFeatured,
					namespace: data.owner.login,
				});
			} catch (error) {
				echo.warn(`Error fetching external project ${extProject.url}:`, error);
			}
		}

		return projects;
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
