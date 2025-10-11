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
			projectDiv.className = "project";

			const headerDiv = document.createElement("div");
			headerDiv.className = "project-header";

			const title = document.createElement("h3");
			title.textContent = project.name;
			title.style.margin = "0";
			headerDiv.appendChild(title);

			const statsDiv = document.createElement("div");
			statsDiv.className = "project-stats";

			const starsSpan = document.createElement("span");
			starsSpan.className = "project-stat";
			const starIcon = document.createElement("img");
			starIcon.src = "/public/assets/icons/star.svg";
			starIcon.alt = "Stars";
			starsSpan.appendChild(starIcon);
			starsSpan.appendChild(document.createTextNode(project.stats.stars));
			statsDiv.appendChild(starsSpan);

			const forksSpan = document.createElement("span");
			forksSpan.className = "project-stat";
			const forkIcon = document.createElement("img");
			forkIcon.src = "/public/assets/icons/fork.svg";
			forkIcon.alt = "Forks";
			forksSpan.appendChild(forkIcon);
			forksSpan.appendChild(document.createTextNode(project.stats.forks));
			statsDiv.appendChild(forksSpan);

			const issuesSpan = document.createElement("span");
			issuesSpan.className = "project-stat";
			const issuesIcon = document.createElement("img");
			issuesIcon.src = "/public/assets/icons/issues.svg";
			issuesIcon.alt = "Issues";
			issuesSpan.appendChild(issuesIcon);
			issuesSpan.appendChild(document.createTextNode(project.stats.issues));
			statsDiv.appendChild(issuesSpan);

			headerDiv.appendChild(statsDiv);
			projectDiv.appendChild(headerDiv);

			const description = document.createElement("p");
			description.textContent = project.description;
			projectDiv.appendChild(description);

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
			projectDiv.appendChild(techDiv);

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
