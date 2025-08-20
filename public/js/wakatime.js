let wakaTimeData = null;
let wakaTimeError = null;

fetch("/api/wakatime")
	.then((response) => {
		if (!response.ok) throw new Error("Failed to fetch stats");
		return response.json();
	})
	.then((data) => {
		if (data.error) {
			wakaTimeError = "WakaTime stats unavailable";
			return;
		}
		wakaTimeData = data;
	})
	.catch(() => {
		wakaTimeError = "Failed to load coding stats";
	});

function updateWakaTimeStats() {
	const statsContainer = document.getElementById("wakatime-stats");

	if (wakaTimeError) {
		return;
	}

	if (wakaTimeData) {
		const wakatimeSection = document.querySelector(".wakatime-section");
		if (wakatimeSection) {
			wakatimeSection.style.display = "block";
		}
		renderWakaTimeStats(wakaTimeData);
		setTimeout(() => {
			statsContainer.style.opacity = "1";
		}, 10);
		return;
	}

	setTimeout(updateWakaTimeStats, 50);
}

function renderWakaTimeStats(data) {
	const container = document.getElementById("wakatime-stats");

	const statsHTML = `
		<div class="wakatime-stats">
			<div class="stats-overview">
				<div class="stats-grid">
					<div class="stat-card featured">
						<div class="stat-value">${data.allTime.total}</div>
						<div class="stat-secondary">All Time</div>
					</div>
					<div class="stat-card">
						<div class="stat-value">${data.today.total}</div>
						<div class="stat-secondary">Today</div>
					</div>
					<div class="stat-card">
						<div class="stat-value">${data.allTime.average}</div>
						<div class="stat-secondary">Daily Avg</div>
					</div>
				</div>
			</div>

			<div class="content-sections">
				<div class="content-section">
					<h4>Languages</h4>
					<div class="simple-list">
						${data.allTime.languages
							.slice(0, 6)
							.map(
								(lang) => `
							<div class="simple-item">
								<span class="item-name">${lang.name}</span>
								<div class="item-stats">
									<span class="item-percent">${lang.percent}%</span>
									<span>${lang.hours}h ${lang.minutes}m</span>
								</div>
							</div>
						`,
							)
							.join("")}
					</div>
				</div>

				<div class="content-section">
					<h4>Projects</h4>
					<div class="simple-list">
						${data.allTime.projects
							.slice(0, 6)
							.map(
								(project) => `
							<div class="simple-item">
								<span class="item-name">${project.name}</span>
								<div class="item-stats">
									<span class="item-percent">${project.percent}%</span>
									<span>${project.hours}h ${project.minutes}m</span>
								</div>
							</div>
						`,
							)
							.join("")}
					</div>
				</div>

				<div class="content-section">
					<h4>Editors</h4>
					<div class="simple-list">
						${
							data.allTime.editors
								?.slice(0, 4)
								.map(
									(editor) => `
							<div class="simple-item">
								<span class="item-name">${editor.name}</span>
								<div class="item-stats">
									<span class="item-percent">${editor.percent}%</span>
								</div>
							</div>
						`,
								)
								.join("") || ""
						}
					</div>
				</div>

				<div class="content-section">
					<h4>Operating Systems</h4>
					<div class="simple-list">
						${
							data.allTime.operatingSystems
								?.slice(0, 4)
								.map(
									(os) => `
							<div class="simple-item">
								<span class="item-name">${os.name}</span>
								<div class="item-stats">
									<span class="item-percent">${os.percent}%</span>
								</div>
							</div>
						`,
								)
								.join("") || ""
						}
					</div>
				</div>
			</div>

			${
				data.today.totalSeconds > 0
					? `<div class="today-highlight">
					<h3>Today's Activity</h3>
					<div class="today-grid">
						${
							data.today.languages?.length
								? `<div class="today-card">
								<h5>Languages</h5>
								<div class="today-tags">
									${data.today.languages
										.slice(0, 4)
										.map(
											(lang) => `<span class="today-tag">${lang.name}</span>`,
										)
										.join("")}
								</div>
							</div>`
								: ""
						}
						${
							data.today.projects?.length
								? `<div class="today-card">
								<h5>Projects</h5>
								<div class="today-tags">
									${data.today.projects
										.slice(0, 4)
										.map(
											(project) =>
												`<span class="today-tag">${project.name}</span>`,
										)
										.join("")}
								</div>
							</div>`
								: ""
						}
					</div>
				</div>`
					: ""
			}
		</div>
	`;

	container.innerHTML = statsHTML;

	setTimeout(() => {
		const statsSection = container.querySelector(".wakatime-stats");
		if (statsSection) {
			statsSection.style.opacity = "1";
		}
	}, 100);
}

document.addEventListener("DOMContentLoaded", updateWakaTimeStats);
