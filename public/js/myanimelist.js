let malData = null;
let malError = null;
const animeById = {};

fetch("/api/mal/stats")
	.then((response) => {
		if (!response.ok) throw new Error("Failed to fetch stats");
		return response.json();
	})
	.then((data) => {
		if (data.error) {
			malError = data.error;
			return;
		}
		malData = data;
		buildAnimeIndex(data);
	})
	.catch(() => {
		malError = "Failed to load anime stats";
	});

function buildAnimeIndex(data) {
	const allLists = [
		...(data.watching || []),
		...(data.completed || []),
		...(data.onHold || []),
		...(data.dropped || []),
		...(data.planToWatch || []),
	];

	for (const item of allLists) {
		animeById[item.node.id] = item;
	}
}

function updateMALStats() {
	const statsContainer = document.getElementById("mal-stats");

	if (malError) {
		window.location.href = "/";
		return;
	}

	if (malData) {
		statsContainer.style.display = "block";
		renderMALStats(malData);
		createAnimeModal();
		setupAnimeClickHandlers();
		setTimeout(() => {
			statsContainer.style.opacity = "1";
		}, 10);
		return;
	}

	setTimeout(updateMALStats, 50);
}

function formatSeason(item) {
	if (item.node.start_season) {
		const season = item.node.start_season.season;
		const year = item.node.start_season.year;
		const seasonName = season.charAt(0).toUpperCase() + season.slice(1);
		return `${seasonName} ${year}`;
	}
	return null;
}

function formatMediaType(type) {
	const types = {
		tv: "TV",
		movie: "Movie",
		ova: "OVA",
		ona: "ONA",
		special: "Special",
		music: "Music",
	};
	return types[type] || type?.toUpperCase() || "TV";
}

function createAnimeModal() {
	if (document.getElementById("anime-modal-overlay")) return;

	const modalHTML = `
		<div id="anime-modal-overlay" class="anime-modal-overlay">
			<div class="anime-modal">
				<div class="anime-modal-header">
					<div class="anime-modal-cover">
						<img id="modal-cover" src="" alt="">
					</div>
					<div class="anime-modal-info">
						<h3 id="modal-title" class="anime-modal-title"></h3>
						<div id="modal-meta" class="anime-modal-meta"></div>
						<div id="modal-score" class="anime-modal-score"></div>
						<div id="modal-dates" class="anime-modal-dates"></div>
						<div id="modal-genres" class="anime-modal-genres"></div>
					</div>
				</div>
				<div class="anime-modal-body">
					<p id="modal-synopsis" class="anime-modal-synopsis"></p>
				</div>
				<div class="anime-modal-footer">
					<a id="modal-mal-link" href="" target="_blank" class="anime-modal-link">view on mal</a>
					<button class="anime-modal-close" onclick="closeAnimeModal()">close</button>
				</div>
			</div>
		</div>
	`;

	document.body.insertAdjacentHTML("beforeend", modalHTML);

	const overlay = document.getElementById("anime-modal-overlay");
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) {
			closeAnimeModal();
		}
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			closeAnimeModal();
		}
	});
}

function showAnimeModal(animeId) {
	const anime = animeById[animeId];
	if (!anime) return;

	const overlay = document.getElementById("anime-modal-overlay");
	const coverImg = document.getElementById("modal-cover");
	const title = document.getElementById("modal-title");
	const meta = document.getElementById("modal-meta");
	const score = document.getElementById("modal-score");
	const dates = document.getElementById("modal-dates");
	const genres = document.getElementById("modal-genres");
	const synopsis = document.getElementById("modal-synopsis");
	const malLink = document.getElementById("modal-mal-link");

	const node = anime.node;
	const listStatus = anime.list_status;

	if (node.main_picture) {
		coverImg.src = node.main_picture.large || node.main_picture.medium;
		coverImg.alt = node.title;
		coverImg.style.display = "block";
	} else {
		coverImg.style.display = "none";
	}

	title.textContent = node.title;

	const mediaType = formatMediaType(node.media_type);
	const season = formatSeason(anime);
	const episodes = node.num_episodes ? `${node.num_episodes} episodes` : null;

	const metaParts = [mediaType, season, episodes].filter(Boolean);
	meta.innerHTML = metaParts.map((part) => `<span>${part}</span>`).join("");

	if (node.mean || listStatus.score > 0) {
		const displayScore = listStatus.score > 0 ? listStatus.score : node.mean;
		const scoreLabel = listStatus.score > 0 ? "your score" : "average";
		score.innerHTML = `<span>★</span> ${displayScore} <span style="color: var(--text-secondary); font-size: var(--font-size-xs);">(${scoreLabel})</span>`;
	} else {
		score.innerHTML = "";
	}

	const dateParts = [];
	if (listStatus.start_date) {
		dateParts.push(
			`started: ${new Date(listStatus.start_date).toLocaleDateString()}`,
		);
	}
	if (listStatus.finish_date) {
		dateParts.push(
			`finished: ${new Date(listStatus.finish_date).toLocaleDateString()}`,
		);
	}
	dates.innerHTML =
		dateParts.length > 0
			? dateParts.map((d) => `<span>${d}</span>`).join("")
			: "";

	if (node.genres && node.genres.length > 0) {
		genres.innerHTML = node.genres
			.map(
				(genre) =>
					`<span class="anime-modal-genre">${genre.name.toLowerCase()}</span>`,
			)
			.join("");
	} else {
		genres.innerHTML = "";
	}

	synopsis.textContent = node.synopsis || "";

	malLink.href = `https://myanimelist.net/anime/${node.id}`;

	overlay.classList.add("active");
	document.body.style.overflow = "hidden";
}

function closeAnimeModal() {
	const overlay = document.getElementById("anime-modal-overlay");
	if (overlay) {
		overlay.classList.remove("active");
		document.body.style.overflow = "";
	}
}

function setupAnimeClickHandlers() {
	document.querySelectorAll(".anime-card, .anime-grid-item").forEach((card) => {
		card.addEventListener("click", () => {
			const animeId = card.dataset.animeId;
			if (animeId) {
				showAnimeModal(Number(animeId));
			}
		});
	});
}

function renderMALStats(data) {
	const container = document.getElementById("mal-stats");
	const stats = data.statistics;

	const statsHTML = `
		<div class="stats-bar">
			<div class="stats-bar-item">
				<span class="stats-bar-value">${Math.round(stats.daysWatched)}</span>
				<span class="stats-bar-label">days watched</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${stats.totalEpisodes.toLocaleString()}</span>
				<span class="stats-bar-label">episodes</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${stats.meanScore.toFixed(1)}</span>
				<span class="stats-bar-label">mean score</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${stats.totalAnime}</span>
				<span class="stats-bar-label">total</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${stats.completed}</span>
				<span class="stats-bar-label">completed</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${stats.watching}</span>
				<span class="stats-bar-label">watching</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${stats.onHold}</span>
				<span class="stats-bar-label">on hold</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${stats.dropped}</span>
				<span class="stats-bar-label">dropped</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${stats.planToWatch}</span>
				<span class="stats-bar-label">plan to watch</span>
			</div>
		</div>

		${
			data.watching.length > 0
				? `
		<div class="currently-watching">
			<div class="section-header">
				<h4>currently watching</h4>
				<span class="section-count">(${data.watching.length})</span>
			</div>
			<div class="anime-carousel">
				${data.watching
					.slice(0, 15)
					.map((item) => {
						const progress = item.node.num_episodes
							? (item.list_status.num_episodes_watched /
									item.node.num_episodes) *
								100
							: 0;
						const season = formatSeason(item);
						const mediaType = formatMediaType(item.node.media_type);

						return `
					<div class="anime-card" data-anime-id="${item.node.id}">
						<div class="anime-card-cover">
							${
								item.node.main_picture
									? `<img src="${item.node.main_picture.large || item.node.main_picture.medium}" alt="${item.node.title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
							<div class="anime-card-overlay">
								<div class="anime-card-progress">
									<div class="anime-card-progress-fill" style="width: ${progress}%"></div>
								</div>
								<div class="anime-card-episodes">
									<span class="current">${item.list_status.num_episodes_watched}</span> / ${item.node.num_episodes || "?"} episodes
								</div>
							</div>
						</div>
						<div class="anime-card-info">
							<div class="anime-card-title">${item.node.title}</div>
							<div class="anime-card-meta">
								<span class="anime-card-type">${mediaType}</span>
								${season ? `<span class="anime-card-season">${season}</span>` : ""}
								${item.node.mean ? `<span class="anime-card-score"><span class="star">★</span> ${item.node.mean}</span>` : ""}
							</div>
						</div>
					</div>
				`;
					})
					.join("")}
			</div>
		</div>
		`
				: ""
		}

		${
			data.completed.length > 0
				? `
		<div class="all-anime">
			<div class="section-header">
				<h4>completed</h4>
				<span class="section-count">(${data.completed.length})</span>
			</div>
			<div class="anime-search">
				<input type="text" id="anime-search-input" class="search-input" placeholder="search completed anime..." oninput="filterAnime()">
			</div>
			<div class="anime-grid" id="all-anime-grid">
				${data.completed
					.slice(0, 60)
					.map((item) => {
						const season = formatSeason(item);
						const mediaType = formatMediaType(item.node.media_type);

						return `
					<div class="anime-grid-item" data-anime-id="${item.node.id}" data-title="${item.node.title.toLowerCase()}">
						<div class="anime-grid-cover">
							${
								item.node.main_picture
									? `<img src="${item.node.main_picture.medium}" alt="${item.node.title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
							${item.list_status.score > 0 ? `<div class="anime-grid-score-badge"><span>★</span> ${item.list_status.score}</div>` : ""}
						</div>
						<div class="anime-grid-info">
							<div class="anime-grid-title">${item.node.title}</div>
							<div class="anime-grid-meta">
								<span class="anime-grid-type">${mediaType}</span>
								${season ? `<span>${season}</span>` : ""}
							</div>
						</div>
					</div>
				`;
					})
					.join("")}
			</div>
		</div>
		`
				: ""
		}

		${
			data.onHold && data.onHold.length > 0
				? `
		<div class="all-anime">
			<div class="section-header">
				<h4>on hold</h4>
				<span class="section-count">(${data.onHold.length})</span>
			</div>
			<div class="anime-grid">
				${data.onHold
					.map((item) => {
						const season = formatSeason(item);
						const mediaType = formatMediaType(item.node.media_type);

						return `
					<div class="anime-grid-item" data-anime-id="${item.node.id}">
						<div class="anime-grid-cover">
							${
								item.node.main_picture
									? `<img src="${item.node.main_picture.medium}" alt="${item.node.title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
							${item.list_status.score > 0 ? `<div class="anime-grid-score-badge"><span>★</span> ${item.list_status.score}</div>` : ""}
						</div>
						<div class="anime-grid-info">
							<div class="anime-grid-title">${item.node.title}</div>
							<div class="anime-grid-meta">
								<span class="anime-grid-type">${mediaType}</span>
								${season ? `<span>${season}</span>` : ""}
							</div>
						</div>
					</div>
				`;
					})
					.join("")}
			</div>
		</div>
		`
				: ""
		}

		${
			data.dropped && data.dropped.length > 0
				? `
		<div class="all-anime">
			<div class="section-header">
				<h4>dropped</h4>
				<span class="section-count">(${data.dropped.length})</span>
			</div>
			<div class="anime-grid">
				${data.dropped
					.map((item) => {
						const season = formatSeason(item);
						const mediaType = formatMediaType(item.node.media_type);

						return `
					<div class="anime-grid-item" data-anime-id="${item.node.id}">
						<div class="anime-grid-cover">
							${
								item.node.main_picture
									? `<img src="${item.node.main_picture.medium}" alt="${item.node.title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
							${item.list_status.score > 0 ? `<div class="anime-grid-score-badge"><span>★</span> ${item.list_status.score}</div>` : ""}
						</div>
						<div class="anime-grid-info">
							<div class="anime-grid-title">${item.node.title}</div>
							<div class="anime-grid-meta">
								<span class="anime-grid-type">${mediaType}</span>
								${season ? `<span>${season}</span>` : ""}
							</div>
						</div>
					</div>
				`;
					})
					.join("")}
			</div>
		</div>
		`
				: ""
		}

		${
			data.planToWatch && data.planToWatch.length > 0
				? `
		<div class="all-anime">
			<div class="section-header">
				<h4>plan to watch</h4>
				<span class="section-count">(${data.planToWatch.length})</span>
			</div>
			<div class="anime-grid">
				${data.planToWatch
					.slice(0, 30)
					.map((item) => {
						const season = formatSeason(item);
						const mediaType = formatMediaType(item.node.media_type);

						return `
					<div class="anime-grid-item" data-anime-id="${item.node.id}">
						<div class="anime-grid-cover">
							${
								item.node.main_picture
									? `<img src="${item.node.main_picture.medium}" alt="${item.node.title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
						</div>
						<div class="anime-grid-info">
							<div class="anime-grid-title">${item.node.title}</div>
							<div class="anime-grid-meta">
								<span class="anime-grid-type">${mediaType}</span>
								${season ? `<span>${season}</span>` : ""}
							</div>
						</div>
					</div>
				`;
					})
					.join("")}
			</div>
		</div>
		`
				: ""
		}

		${
			data.user
				? `
		<div class="user-profile-section">
			<div class="section-header">
				<h4>profile</h4>
			</div>
			<div class="profile-stats">
				<div class="profile-stat">
					<span class="profile-label">username</span>
					<span class="profile-value">${data.user.name}</span>
				</div>
				${
					data.user.joined_at
						? `
				<div class="profile-stat">
					<span class="profile-label">member since</span>
					<span class="profile-value">${new Date(data.user.joined_at).toLocaleDateString()}</span>
				</div>
				`
						: ""
				}
			</div>
		</div>
		`
				: ""
		}
	`;

	container.innerHTML = statsHTML;
}

// biome-ignore lint/correctness/noUnusedVariables: Used in HTML oninput attribute
function filterAnime() {
	const searchInput = document.getElementById("anime-search-input");
	const animeGrid = document.getElementById("all-anime-grid");

	if (!searchInput || !animeGrid) return;

	const searchTerm = searchInput.value.toLowerCase();
	const animeItems = animeGrid.querySelectorAll(".anime-grid-item");

	animeItems.forEach((item) => {
		const title = item.dataset.title || "";
		if (title.includes(searchTerm)) {
			item.style.display = "";
		} else {
			item.style.display = "none";
		}
	});
}

window.closeAnimeModal = closeAnimeModal;

document.addEventListener("DOMContentLoaded", updateMALStats);
