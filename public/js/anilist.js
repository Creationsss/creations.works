let anilistData = null;
let anilistError = null;
const animeById = {};

fetch("/api/anilist/stats")
	.then((response) => {
		if (!response.ok) throw new Error("Failed to fetch stats");
		return response.json();
	})
	.then((data) => {
		if (data.error) {
			anilistError = data.error;
			return;
		}
		anilistData = data;
		buildAnimeIndex(data);
	})
	.catch(() => {
		anilistError = "Failed to load anime stats";
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
		animeById[item.media.id] = item;
	}
}

function updateAniListStats() {
	const statsContainer = document.getElementById("mal-stats");

	if (anilistError) {
		window.location.href = "/";
		return;
	}

	if (anilistData) {
		statsContainer.style.display = "block";
		renderAniListStats(anilistData);
		createAnimeModal();
		setupAnimeClickHandlers();
		setTimeout(() => {
			statsContainer.style.opacity = "1";
		}, 10);
		return;
	}

	setTimeout(updateAniListStats, 50);
}

function getTitle(media) {
	return media.title.english || media.title.romaji || media.title.native;
}

function formatSeason(item) {
	if (item.media.season && item.media.seasonYear) {
		const season =
			item.media.season.charAt(0) + item.media.season.slice(1).toLowerCase();
		return `${season} ${item.media.seasonYear}`;
	}
	return null;
}

function formatMediaType(format) {
	const types = {
		TV: "TV",
		TV_SHORT: "TV Short",
		MOVIE: "Movie",
		SPECIAL: "Special",
		OVA: "OVA",
		ONA: "ONA",
		MUSIC: "Music",
	};
	return types[format] || format || "TV";
}

function formatDate(dateObj) {
	if (!dateObj || !dateObj.year) return null;
	const { year, month, day } = dateObj;
	if (month && day) {
		return new Date(year, month - 1, day).toLocaleDateString();
	}
	if (month) {
		return `${month}/${year}`;
	}
	return `${year}`;
}

function formatShortDate(dateObj) {
	if (!dateObj || !dateObj.year) return null;
	const { year, month, day } = dateObj;
	if (month && day) {
		return `${month}/${day}/${year.toString().slice(-2)}`;
	}
	if (month) {
		return `${month}/${year.toString().slice(-2)}`;
	}
	return `${year}`;
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
					<a id="modal-anilist-link" href="" target="_blank" class="anime-modal-link">view on anilist</a>
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
	const anilistLink = document.getElementById("modal-anilist-link");

	const media = anime.media;

	if (media.coverImage) {
		coverImg.src = media.coverImage.extraLarge || media.coverImage.large;
		coverImg.alt = getTitle(media);
		coverImg.style.display = "block";
	} else {
		coverImg.style.display = "none";
	}

	title.textContent = getTitle(media);

	const mediaType = formatMediaType(media.format);
	const season = formatSeason(anime);
	const episodes = media.episodes ? `${media.episodes} episodes` : null;

	const metaParts = [mediaType, season, episodes].filter(Boolean);
	meta.innerHTML = metaParts.map((part) => `<span>${part}</span>`).join("");

	if (media.averageScore || anime.score > 0) {
		const displayScore =
			anime.score > 0 ? anime.score : Math.round(media.averageScore / 10);
		const scoreLabel = anime.score > 0 ? "your score" : "average";
		score.innerHTML = `<span>★</span> ${displayScore} <span style="color: var(--text-secondary); font-size: var(--font-size-xs);">(${scoreLabel})</span>`;
	} else {
		score.innerHTML = "";
	}

	const dateParts = [];
	const startDate = formatDate(anime.startedAt);
	const endDate = formatDate(anime.completedAt);
	if (startDate) {
		dateParts.push(`started: ${startDate}`);
	}
	if (endDate) {
		dateParts.push(`finished: ${endDate}`);
	}
	dates.innerHTML =
		dateParts.length > 0
			? dateParts.map((d) => `<span>${d}</span>`).join("")
			: "";

	if (media.genres && media.genres.length > 0) {
		genres.innerHTML = media.genres
			.map(
				(genre) =>
					`<span class="anime-modal-genre">${genre.toLowerCase()}</span>`,
			)
			.join("");
	} else {
		genres.innerHTML = "";
	}

	synopsis.textContent = (media.description || "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]*>/g, "");

	anilistLink.href = `https://anilist.co/anime/${media.id}`;

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

function renderAniListStats(data) {
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
				<span class="stats-bar-value">${(stats.meanScore / 10).toFixed(1)}</span>
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
						const progress = item.media.episodes
							? (item.progress / item.media.episodes) * 100
							: 0;
						const season = formatSeason(item);
						const mediaType = formatMediaType(item.media.format);
						const title = getTitle(item.media);
						const startDate = formatShortDate(item.startedAt);

						return `
					<div class="anime-card" data-anime-id="${item.media.id}">
						<div class="anime-card-cover">
							${
								item.media.coverImage
									? `<img src="${item.media.coverImage.extraLarge || item.media.coverImage.large}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
							${startDate ? `<div class="anime-card-date-badge">${startDate}</div>` : ""}
							<div class="anime-card-overlay">
								<div class="anime-card-progress">
									<div class="anime-card-progress-fill" style="width: ${progress}%"></div>
								</div>
								<div class="anime-card-episodes">
									<span class="current">${item.progress}</span> / ${item.media.episodes || "?"} episodes
								</div>
							</div>
						</div>
						<div class="anime-card-info">
							<div class="anime-card-title">${title}</div>
							<div class="anime-card-meta">
								<span class="anime-card-type">${mediaType}</span>
								${season ? `<span class="anime-card-season">${season}</span>` : ""}
								${item.media.averageScore ? `<span class="anime-card-score"><span class="star">★</span> ${(item.media.averageScore / 10).toFixed(1)}</span>` : ""}
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
						const mediaType = formatMediaType(item.media.format);
						const title = getTitle(item.media);
						const completedDate = formatShortDate(item.completedAt);

						return `
					<div class="anime-grid-item" data-anime-id="${item.media.id}" data-title="${title.toLowerCase()}">
						<div class="anime-grid-cover">
							${
								item.media.coverImage
									? `<img src="${item.media.coverImage.extraLarge || item.media.coverImage.large}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
							${item.score > 0 ? `<div class="anime-grid-score-badge"><span>★</span> ${item.score}</div>` : ""}
							${completedDate ? `<div class="anime-grid-date-badge">${completedDate}</div>` : ""}
						</div>
						<div class="anime-grid-info">
							<div class="anime-grid-title">${title}</div>
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
						const mediaType = formatMediaType(item.media.format);
						const title = getTitle(item.media);
						const startDate = formatShortDate(item.startedAt);

						return `
					<div class="anime-grid-item" data-anime-id="${item.media.id}">
						<div class="anime-grid-cover">
							${
								item.media.coverImage
									? `<img src="${item.media.coverImage.extraLarge || item.media.coverImage.large}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
							${item.score > 0 ? `<div class="anime-grid-score-badge"><span>★</span> ${item.score}</div>` : ""}
							${startDate ? `<div class="anime-grid-date-badge">${startDate}</div>` : ""}
						</div>
						<div class="anime-grid-info">
							<div class="anime-grid-title">${title}</div>
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
						const mediaType = formatMediaType(item.media.format);
						const title = getTitle(item.media);
						const startDate = formatShortDate(item.startedAt);

						return `
					<div class="anime-grid-item" data-anime-id="${item.media.id}">
						<div class="anime-grid-cover">
							${
								item.media.coverImage
									? `<img src="${item.media.coverImage.extraLarge || item.media.coverImage.large}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
							${item.score > 0 ? `<div class="anime-grid-score-badge"><span>★</span> ${item.score}</div>` : ""}
							${startDate ? `<div class="anime-grid-date-badge">${startDate}</div>` : ""}
						</div>
						<div class="anime-grid-info">
							<div class="anime-grid-title">${title}</div>
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
						const mediaType = formatMediaType(item.media.format);
						const title = getTitle(item.media);

						return `
					<div class="anime-grid-item" data-anime-id="${item.media.id}">
						<div class="anime-grid-cover">
							${
								item.media.coverImage
									? `<img src="${item.media.coverImage.extraLarge || item.media.coverImage.large}" alt="${title}" loading="lazy" onerror="this.style.display='none'">`
									: ""
							}
						</div>
						<div class="anime-grid-info">
							<div class="anime-grid-title">${title}</div>
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
					data.user.createdAt
						? `
				<div class="profile-stat">
					<span class="profile-label">member since</span>
					<span class="profile-value">${new Date(data.user.createdAt * 1000).toLocaleDateString()}</span>
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

document.addEventListener("DOMContentLoaded", updateAniListStats);
