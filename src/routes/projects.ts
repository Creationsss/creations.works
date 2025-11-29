import { resolve } from "node:path";
import { CONTENT_TYPE } from "#constants";
import { getCachedProjectLinks } from "#services/project-links";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.HTML,
};

function getIconForUrl(url: string): string {
	if (url.includes("github.com")) {
		return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
		</svg>`;
	}
	if (url.includes("gitlab") || url.includes("heliopolis")) {
		return `<svg width="32" height="32" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none">
			<path fill="#FC6D26" d="M14.975 8.904L14.19 6.55l-1.552-4.67a.268.268 0 00-.255-.18.268.268 0 00-.254.18l-1.552 4.667H5.422L3.87 1.879a.267.267 0 00-.254-.179.267.267 0 00-.254.18l-1.55 4.667-.784 2.357a.515.515 0 00.193.583l6.78 4.812 6.778-4.812a.516.516 0 00.196-.583z"/>
			<path fill="#E24329" d="M8 14.296l2.578-7.75H5.423L8 14.296z"/>
			<path fill="#FC6D26" d="M8 14.296l-2.579-7.75H1.813L8 14.296z"/>
		</svg>`;
	}
	if (url.includes("npm")) {
		return `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
			<path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.664H5.334v-4H3.999v4H1.335V8.667h5.331v5.331zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.336v4h-1.335v-4h-1.33v4h-2.671V8.667h8.002v5.331zM10.665 10H12v2.667h-1.335V10z"/>
		</svg>`;
	}
	return `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
		<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
		<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
	</svg>`;
}

function getDisplayPath(url: string): string {
	try {
		const parsed = new URL(url);
		const path = parsed.pathname
			.replace(/^\//, "")
			.replace(/\/$/, "")
			.replace(/\.git$/, "");
		return path || parsed.host;
	} catch {
		return url;
	}
}

async function handler(): Promise<Response> {
	const templatePath = resolve("public", "views", "projects.html");
	const file = Bun.file(templatePath);

	if (!(await file.exists())) {
		return new Response("Template not found", { status: 404 });
	}

	let html = await file.text();

	const cachedData = getCachedProjectLinks();
	const projects = cachedData?.projects || [];

	const projectsHtml = projects
		.map(
			(project) => `
		<a href="${project.url}" class="contact-link large project-link" target="_blank" rel="noopener noreferrer">
			${getIconForUrl(project.url)}
			<div class="contact-text">
				<span>${project.name}</span>
				${project.description ? `<small class="project-description">${project.description}</small>` : ""}
			</div>
			<small class="contact-url">${getDisplayPath(project.url)}</small>
		</a>
	`,
		)
		.join("\n");

	html = html.replace(
		'<div class="full-page-contacts" id="projects-list"></div>',
		`<div class="full-page-contacts" id="projects-list">${projectsHtml}</div>`,
	);

	return new Response(html, {
		headers: { "Content-Type": CONTENT_TYPE.HTML },
	});
}

export { handler, routeDef };
