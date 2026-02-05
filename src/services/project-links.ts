import { echo } from "@atums/echo";
import { gitlab, projectLinks } from "#environment";
import { normalizeUrl } from "#utils/url";
import { CachedService } from "./base-cache";

class ProjectLinksService extends CachedService<ProjectLinksData> {
	protected async fetchData(): Promise<ProjectLinksData | null> {
		const projects: ProjectInfo[] = [];

		for (const link of projectLinks) {
			try {
				const info = await this.fetchProjectInfo(link.url);
				if (info) {
					projects.push(info);
				}
			} catch (error) {
				echo.warn(`Failed to fetch project info for ${link.url}:`, error);
			}
		}

		return { projects };
	}

	private async fetchProjectInfo(url: string): Promise<ProjectInfo | null> {
		const githubMatch = url.match(/github\.com\/([^/]+)\/([^/]+)/);
		if (githubMatch?.[1] && githubMatch?.[2]) {
			return this.fetchGitHubProject(
				githubMatch[1],
				githubMatch[2].replace(/\.git$/, ""),
				url,
			);
		}

		const codebergMatch = url.match(/codeberg\.org\/([^/]+)\/([^/]+)/);
		if (codebergMatch?.[1] && codebergMatch?.[2]) {
			return this.fetchCodebergProject(
				codebergMatch[1],
				codebergMatch[2].replace(/\.git$/, ""),
				url,
			);
		}

		const gitlabMatch = url.match(/([^/]+)\/([^/]+)\/([^/]+)\/?$/);
		if (
			gitlabMatch?.[2] &&
			gitlabMatch[3] &&
			gitlab.instanceUrl &&
			gitlab.token
		) {
			const host = new URL(url).host;
			const normalizedInstanceUrl = normalizeUrl(gitlab.instanceUrl);
			const gitlabHost = new URL(normalizedInstanceUrl).host;
			if (host === gitlabHost) {
				return this.fetchGitLabProject(
					gitlabMatch[2],
					gitlabMatch[3].replace(/\.git$/, ""),
					url,
				);
			}
		}

		echo.warn(`Unsupported project URL format: ${url}`);
		return null;
	}

	private async fetchGitHubProject(
		owner: string,
		repo: string,
		originalUrl: string,
	): Promise<ProjectInfo | null> {
		const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
		const response = await fetch(apiUrl, {
			headers: {
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "creations.works",
			},
		});

		if (!response.ok) {
			echo.warn(`GitHub API error for ${owner}/${repo}: ${response.status}`);
			return null;
		}

		const data = (await response.json()) as {
			name: string;
			description: string | null;
			html_url: string;
		};
		return {
			name: data.name,
			description: data.description || "",
			url: data.html_url || originalUrl,
		};
	}

	private async fetchCodebergProject(
		owner: string,
		repo: string,
		originalUrl: string,
	): Promise<ProjectInfo | null> {
		const apiUrl = `https://codeberg.org/api/v1/repos/${owner}/${repo}`;
		const response = await fetch(apiUrl, {
			headers: {
				Accept: "application/json",
				"User-Agent": "creations.works",
			},
		});

		if (!response.ok) {
			echo.warn(`Codeberg API error for ${owner}/${repo}: ${response.status}`);
			return null;
		}

		const data = (await response.json()) as {
			name: string;
			description: string | null;
			html_url: string;
		};
		return {
			name: data.name,
			description: data.description || "",
			url: data.html_url || originalUrl,
		};
	}

	private async fetchGitLabProject(
		namespace: string,
		project: string,
		originalUrl: string,
	): Promise<ProjectInfo | null> {
		if (!gitlab.instanceUrl || !gitlab.token) {
			return null;
		}

		const baseUrl = normalizeUrl(gitlab.instanceUrl);
		const projectPath = encodeURIComponent(`${namespace}/${project}`);
		const apiUrl = `${baseUrl}/api/v4/projects/${projectPath}`;
		const response = await fetch(apiUrl, {
			headers: {
				"PRIVATE-TOKEN": gitlab.token,
			},
		});

		if (!response.ok) {
			echo.warn(
				`GitLab API error for ${namespace}/${project}: ${response.status}`,
			);
			return null;
		}

		const data = (await response.json()) as {
			name: string;
			description: string | null;
			web_url: string;
		};
		return {
			name: data.name,
			description: data.description || "",
			url: data.web_url || originalUrl,
		};
	}

	protected getServiceName(): string {
		return "Project links";
	}

	protected logCacheSuccess(): void {
		if (this.cache) {
			echo.debug(
				`Project links cached successfully (${this.cache.projects.length} projects)`,
			);
		}
	}
}

const projectLinksService = new ProjectLinksService();

export function getCachedProjectLinks(): ProjectLinksData | null {
	return projectLinksService.getCache();
}

export function startProjectLinksCache(): void {
	projectLinksService.start();
}
