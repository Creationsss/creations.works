async function loadProjects() {
	const container = document.getElementById("projects-container");

	try {
		const response = await fetch("/api/projects");

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(
				`Failed to fetch projects: ${response.status} - ${errorData.details || errorData.error || response.statusText}`,
			);
		}

		const data = await response.json();

		if (data.error) {
			throw new Error(`${data.error}: ${data.details || ""}`);
		}

		const projects = data.projects || [];

		if (projects.length === 0) {
			container.innerHTML = "<p>No projects found.</p>";
			return;
		}

		const projectGrid = document.createElement("div");
		projectGrid.className = "project-grid";

		projects.forEach((project) => {
			const projectDiv = document.createElement("div");
			projectDiv.className = project.featured ? "project featured" : "project";

			const headerDiv = document.createElement("div");
			headerDiv.className = "project-header";

			const title = document.createElement("h3");
			title.textContent = project.name;
			headerDiv.appendChild(title);

			const techDiv = document.createElement("div");
			techDiv.className = "project-tech";

			if (project.technologies && project.technologies.length > 0) {
				project.technologies.forEach((tech) => {
					const techTag = document.createElement("span");
					techTag.className = `tech-tag ${tech.toLowerCase()}`;
					techTag.textContent = tech;
					techDiv.appendChild(techTag);
				});
			}
			headerDiv.appendChild(techDiv);

			const statsDiv = document.createElement("div");
			statsDiv.className = "project-stats";

			const starSVG =
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>';
			const forkSVG =
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>';
			const issuesSVG =
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/></svg>';

			const starsSpan = document.createElement("span");
			starsSpan.className = "project-stat";
			starsSpan.innerHTML = `${starSVG}<span>${project.stats.stars}</span>`;
			statsDiv.appendChild(starsSpan);

			const forksSpan = document.createElement("span");
			forksSpan.className = "project-stat";
			forksSpan.innerHTML = `${forkSVG}<span>${project.stats.forks}</span>`;
			statsDiv.appendChild(forksSpan);

			const issuesSpan = document.createElement("span");
			issuesSpan.className = "project-stat";
			issuesSpan.innerHTML = `${issuesSVG}<span>${project.stats.issues}</span>`;
			statsDiv.appendChild(issuesSpan);

			headerDiv.appendChild(statsDiv);
			projectDiv.appendChild(headerDiv);

			if (project.description && project.description.trim() !== "") {
				const description = document.createElement("p");
				description.textContent = project.description;
				projectDiv.appendChild(description);
			}

			const linksDiv = document.createElement("div");
			linksDiv.className = "project-links";

			if (project.links && project.links.length > 0) {
				project.links.forEach((link) => {
					const linkElement = document.createElement("a");
					linkElement.href = link.url;
					linkElement.className = "project-link";
					linkElement.textContent = link.text;
					linkElement.target = "_blank";
					linkElement.rel = "noopener noreferrer";
					linksDiv.appendChild(linkElement);
				});
			}
			projectDiv.appendChild(linksDiv);

			projectGrid.appendChild(projectDiv);
		});

		container.innerHTML = "";
		container.appendChild(projectGrid);
	} catch (error) {
		container.innerHTML = `
			<div style="padding: var(--spacing-xl); text-align: center;">
				<p style="color: var(--text-secondary); margin-bottom: var(--spacing-md);">Failed to load projects.</p>
				<p style="color: var(--text-muted); font-size: var(--font-size-sm);">${error.message}</p>
			</div>
		`;
	}
}

document.addEventListener("DOMContentLoaded", loadProjects);
