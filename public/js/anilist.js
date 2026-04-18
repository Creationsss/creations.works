import { decodeEntities, delegate, escapeHtml, safeUrl } from "./utils/dom.js";
import { createPaginatedGrid } from "./utils/pagination.js";
import { formatRelativeTime, formatTimeUntil } from "./utils/time.js";

const ANIME_PER_PAGE = 30;

const animeById = {};
let anilistData = null;
let activityData = [];

const MONTH_NAMES = [
	"",
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const MEDIA_TYPES = {
	TV: "TV",
	TV_SHORT: "TV Short",
	MOVIE: "Movie",
	SPECIAL: "Special",
	OVA: "OVA",
	ONA: "ONA",
	MUSIC: "Music",
};

const SOURCES = {
	ORIGINAL: "Original",
	MANGA: "Manga",
	LIGHT_NOVEL: "Light Novel",
	VISUAL_NOVEL: "Visual Novel",
	VIDEO_GAME: "Video Game",
	NOVEL: "Novel",
	DOUJINSHI: "Doujinshi",
	ANIME: "Anime",
	WEB_NOVEL: "Web Novel",
	LIVE_ACTION: "Live Action",
	GAME: "Game",
	COMIC: "Comic",
	MULTIMEDIA_PROJECT: "Multimedia Project",
	PICTURE_BOOK: "Picture Book",
	OTHER: "Other",
};

const AIRING_STATUSES = {
	FINISHED: "Finished",
	RELEASING: "Airing",
	NOT_YET_RELEASED: "Not Yet Aired",
	CANCELLED: "Cancelled",
	HIATUS: "On Hiatus",
};

const ACTIVITY_STATUSES = {
	watched: "Watched",
	completed: "Completed",
	dropped: "Dropped",
	paused: "Paused",
	plans_to_watch: "Plans to watch",
	rewatched: "Rewatched",
};

const completedGrid = createPaginatedGrid({
	gridId: "all-anime-grid",
	paginationId: "anime-pagination",
	pageSize: ANIME_PER_PAGE,
	renderGrid: (grid, items) => {
		grid.replaceChildren();
		grid.insertAdjacentHTML(
			"beforeend",
			items
				.map((item) => renderAnimeGridItem(item, { dateField: "completedAt" }))
				.join(""),
		);
	},
	matchItem: (item, term) => getTitle(item.media).toLowerCase().includes(term),
});

function buildAnimeIndex(data) {
	const allLists = [
		...(data.watching || []),
		...(data.completed || []),
		...(data.onHold || []),
		...(data.dropped || []),
		...(data.planToWatch || []),
	];
	for (const item of allLists) animeById[item.media.id] = item;
}

function appendTextWithLinks(parent, text) {
	const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
	let lastIndex = 0;
	for (const match of text.matchAll(linkPattern)) {
		if (match.index > lastIndex) {
			parent.appendChild(
				document.createTextNode(text.slice(lastIndex, match.index)),
			);
		}
		const href = safeUrl(match[2]);
		if (href) {
			const link = document.createElement("a");
			link.href = href;
			link.textContent = match[1];
			link.target = "_blank";
			link.rel = "noopener noreferrer";
			parent.appendChild(link);
		} else {
			parent.appendChild(document.createTextNode(match[0]));
		}
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < text.length) {
		parent.appendChild(document.createTextNode(text.slice(lastIndex)));
	}
}

function getTitle(media) {
	return media.title.english || media.title.romaji || media.title.native;
}

function formatSeason(item) {
	if (item.media.season && item.media.seasonYear) {
		const s = item.media.season;
		const season = s.charAt(0) + s.slice(1).toLowerCase();
		return `${season} ${item.media.seasonYear}`;
	}
	return null;
}

function formatMediaType(format) {
	return MEDIA_TYPES[format] || format || "TV";
}

function formatActivityStatus(status) {
	return ACTIVITY_STATUSES[status?.toLowerCase()] || status || "Updated";
}

function formatSource(source) {
	if (!source) return null;
	return SOURCES[source] || source;
}

function formatAiringStatus(status) {
	return AIRING_STATUSES[status] || status;
}

function getTrailerUrl(trailer) {
	if (!trailer?.id) return null;
	if (trailer.site === "youtube") {
		return `https://youtube.com/watch?v=${encodeURIComponent(trailer.id)}`;
	}
	if (trailer.site === "dailymotion") {
		return `https://dailymotion.com/video/${encodeURIComponent(trailer.id)}`;
	}
	return null;
}

function getStudios(media) {
	if (!media.studios?.nodes) return null;
	const names = media.studios.nodes.map((s) => s.name).filter(Boolean);
	return names.length > 0 ? names.join(", ") : null;
}

function formatDateObj(dateObj, short = false) {
	if (!dateObj?.year) return null;
	const { year, month, day } = dateObj;
	if (short) {
		const yy = year.toString().slice(-2);
		if (month && day) return `${month}/${day}/${yy}`;
		if (month) return `${month}/${yy}`;
		return `${year}`;
	}
	if (month && day) return new Date(year, month - 1, day).toLocaleDateString();
	if (month) return `${month}/${year}`;
	return `${year}`;
}

function renderAnimeGridItem(item, options = {}) {
	const {
		showScore = true,
		showDate = true,
		dateField = "startedAt",
	} = options;
	const season = formatSeason(item);
	const mediaType = formatMediaType(item.media.format);
	const title = getTitle(item.media);
	const date = showDate ? formatDateObj(item[dateField], true) : null;
	const cover = item.media.coverImage
		? item.media.coverImage.extraLarge || item.media.coverImage.large
		: null;

	return `
		<div class="anime-grid-item" data-anime-id="${escapeHtml(item.media.id)}" data-title="${escapeHtml(title.toLowerCase())}">
			<div class="anime-grid-cover">
				${
					cover
						? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.style.display='none'" />`
						: ""
				}
				${showScore && item.score > 0 ? `<div class="anime-grid-score-badge"><span>★</span> ${escapeHtml(item.score)}</div>` : ""}
				${date ? `<div class="anime-grid-date-badge">${escapeHtml(date)}</div>` : ""}
			</div>
			<div class="anime-grid-info">
				<div class="anime-grid-title">${escapeHtml(title)}</div>
				<div class="anime-grid-meta">
					<span class="anime-grid-type">${escapeHtml(mediaType)}</span>
					${season ? `<span>${escapeHtml(season)}</span>` : ""}
				</div>
			</div>
		</div>
	`;
}

function renderAnimeCard(item) {
	const hasEpisodes = item.media.episodes != null;
	const progress = hasEpisodes
		? (item.progress / item.media.episodes) * 100
		: 0;
	const season = formatSeason(item);
	const mediaType = formatMediaType(item.media.format);
	const title = getTitle(item.media);
	const startDate = formatDateObj(item.startedAt, true);
	const cover = item.media.coverImage
		? item.media.coverImage.extraLarge || item.media.coverImage.large
		: null;

	return `
		<div class="anime-card" data-anime-id="${escapeHtml(item.media.id)}">
			<div class="anime-card-cover">
				${cover ? `<img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.style.display='none'" />` : ""}
				${startDate ? `<div class="anime-card-date-badge">${escapeHtml(startDate)}</div>` : ""}
				<div class="anime-card-overlay">
					${hasEpisodes ? `<div class="anime-card-progress"><div class="anime-card-progress-fill" style="width: ${progress}%"></div></div>` : ""}
					<div class="anime-card-episodes">
						<span class="current">${escapeHtml(item.progress)}</span>${hasEpisodes ? ` / ${escapeHtml(item.media.episodes)}` : ""} episodes
					</div>
				</div>
			</div>
			<div class="anime-card-info">
				<div class="anime-card-title">${escapeHtml(title)}</div>
				<div class="anime-card-meta">
					<span class="anime-card-type">${escapeHtml(mediaType)}</span>
					${season ? `<span class="anime-card-season">${escapeHtml(season)}</span>` : ""}
					${item.media.averageScore ? `<span class="anime-card-score"><span class="star">★</span> ${escapeHtml((item.media.averageScore / 10).toFixed(1))}</span>` : ""}
				</div>
			</div>
		</div>
	`;
}

function renderActivityItem(activity) {
	if (activity.type === "TEXT" && activity.text) {
		return `
			<div class="activity-item activity-text">
				<div class="activity-text-content">${escapeHtml(activity.text)}</div>
				<div class="activity-time">${escapeHtml(formatRelativeTime(activity.createdAt))}</div>
			</div>
		`;
	}

	if (activity.media) {
		const title =
			activity.media.title.english || activity.media.title.romaji || "Unknown";
		const statusText = formatActivityStatus(activity.status);
		const progressText = activity.progress ? ` ${activity.progress}` : "";
		const cover = activity.media.coverImage?.medium || "";

		return `
			<div class="activity-item activity-media" data-anime-id="${escapeHtml(activity.media.id)}">
				<div class="activity-cover">
					<img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" loading="lazy" onerror="this.style.display='none'" />
				</div>
				<div class="activity-content">
					<div class="activity-status">${escapeHtml(statusText)}${escapeHtml(progressText)}</div>
					<div class="activity-title">${escapeHtml(title)}</div>
					<div class="activity-time">${escapeHtml(formatRelativeTime(activity.createdAt))}</div>
				</div>
			</div>
		`;
	}

	return "";
}

function closeModal(id) {
	const overlay = document.getElementById(id);
	if (!overlay) return;
	overlay.classList.remove("active");
	document.body.style.overflow = "";
}

function createActivityModal() {
	if (document.getElementById("activity-modal-overlay")) return;

	document.body.insertAdjacentHTML(
		"beforeend",
		`
		<div id="activity-modal-overlay" class="activity-modal-overlay">
			<div class="activity-modal">
				<div class="activity-modal-header">
					<h3>recent activity</h3>
					<button type="button" class="activity-modal-close" data-action="close-activity-modal">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M18 6L6 18M6 6l12 12"/>
						</svg>
					</button>
				</div>
				<div id="activity-list" class="activity-list"></div>
			</div>
		</div>
	`,
	);

	const overlay = document.getElementById("activity-modal-overlay");
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) closeModal("activity-modal-overlay");
	});
}

function createActivityFab(count) {
	if (document.getElementById("activity-fab")) return;

	const badge =
		count > 0
			? `<span class="activity-fab-badge">${escapeHtml(count)}</span>`
			: "";
	document.body.insertAdjacentHTML(
		"beforeend",
		`
		<button type="button" id="activity-fab" class="activity-fab" data-action="open-activity-modal">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			${badge}
		</button>
	`,
	);
}

function openActivityModal() {
	const overlay = document.getElementById("activity-modal-overlay");
	const list = document.getElementById("activity-list");
	if (!overlay || !list) return;

	list.replaceChildren();
	list.insertAdjacentHTML(
		"beforeend",
		activityData.map(renderActivityItem).join(""),
	);

	overlay.classList.add("active");
	document.body.style.overflow = "hidden";
}

function createAnimeModal() {
	if (document.getElementById("anime-modal-overlay")) return;

	document.body.insertAdjacentHTML(
		"beforeend",
		`
		<div id="anime-modal-overlay" class="anime-modal-overlay">
			<div class="anime-modal">
				<div class="anime-modal-header">
					<div class="anime-modal-cover">
						<img id="modal-cover" src="" alt="" />
					</div>
					<div class="anime-modal-info">
						<h3 id="modal-title" class="anime-modal-title"></h3>
						<div id="modal-meta" class="anime-modal-meta"></div>
						<div id="modal-score" class="anime-modal-score"></div>
						<div id="modal-details" class="anime-modal-details"></div>
						<div id="modal-dates" class="anime-modal-dates"></div>
						<div id="modal-genres" class="anime-modal-genres"></div>
					</div>
				</div>
				<div class="anime-modal-body">
					<div id="modal-airing" class="anime-modal-airing"></div>
					<p id="modal-synopsis" class="anime-modal-synopsis"></p>
				</div>
				<div class="anime-modal-footer">
					<a id="modal-anilist-link" href="" target="_blank" rel="noopener noreferrer" class="anime-modal-link">view on anilist</a>
					<a id="modal-trailer-link" href="" target="_blank" rel="noopener noreferrer" class="anime-modal-link anime-modal-trailer">trailer</a>
					<button type="button" class="anime-modal-close" data-action="close-anime-modal">close</button>
				</div>
			</div>
		</div>
	`,
	);

	const overlay = document.getElementById("anime-modal-overlay");
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) closeModal("anime-modal-overlay");
	});
}

function setHtmlList(el, items) {
	el.replaceChildren();
	if (items.length > 0) {
		el.insertAdjacentHTML(
			"beforeend",
			items.map((d) => `<span>${escapeHtml(d)}</span>`).join(""),
		);
	}
}

function showAnimeModal(animeId) {
	const anime = animeById[animeId];
	if (!anime) return;

	const overlay = document.getElementById("anime-modal-overlay");
	const coverImg = document.getElementById("modal-cover");
	const title = document.getElementById("modal-title");
	const meta = document.getElementById("modal-meta");
	const score = document.getElementById("modal-score");
	const details = document.getElementById("modal-details");
	const dates = document.getElementById("modal-dates");
	const genres = document.getElementById("modal-genres");
	const airing = document.getElementById("modal-airing");
	const synopsis = document.getElementById("modal-synopsis");
	const anilistLink = document.getElementById("modal-anilist-link");
	const trailerLink = document.getElementById("modal-trailer-link");

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
	const episodes = media.episodes ? `${media.episodes} eps` : null;
	const duration = media.duration ? `${media.duration} min` : null;
	const airingStatus = formatAiringStatus(media.status);

	setHtmlList(
		meta,
		[mediaType, airingStatus, season, episodes, duration].filter(Boolean),
	);

	score.replaceChildren();
	const scoreRows = [];
	if (anime.score > 0) {
		scoreRows.push(
			`<span>★</span> ${escapeHtml(anime.score)} <span style="color: var(--text-secondary); font-size: var(--font-size-xs);">(your score)</span>`,
		);
	}
	if (media.averageScore) {
		const avg = (media.averageScore / 10).toFixed(1);
		if (anime.score > 0) {
			scoreRows[0] += ` <span style="color: var(--text-secondary); font-size: var(--font-size-xs);">· avg ${escapeHtml(avg)}</span>`;
		} else {
			scoreRows.push(
				`<span>★</span> ${escapeHtml(avg)} <span style="color: var(--text-secondary); font-size: var(--font-size-xs);">(average)</span>`,
			);
		}
	}
	if (scoreRows.length) {
		score.insertAdjacentHTML("beforeend", scoreRows.join(""));
	}

	const detailParts = [];
	const studio = getStudios(media);
	if (studio) detailParts.push(`studio: ${studio}`);
	const source = formatSource(media.source);
	if (source) detailParts.push(`source: ${source}`);
	if (anime.progress > 0 && media.episodes) {
		detailParts.push(`progress: ${anime.progress} / ${media.episodes}`);
	} else if (anime.progress > 0) {
		detailParts.push(`progress: ${anime.progress} eps`);
	}
	setHtmlList(details, detailParts);

	const dateParts = [];
	const userStart = formatDateObj(anime.startedAt);
	const userEnd = formatDateObj(anime.completedAt);
	if (userStart) dateParts.push(`started: ${userStart}`);
	if (userEnd) dateParts.push(`finished: ${userEnd}`);
	const airStart = formatDateObj(media.startDate);
	const airEnd = formatDateObj(media.endDate);
	if (airStart)
		dateParts.push(`aired: ${airStart}${airEnd ? ` – ${airEnd}` : ""}`);
	setHtmlList(dates, dateParts);

	airing.replaceChildren();
	if (media.nextAiringEpisode) {
		const next = media.nextAiringEpisode;
		const timeStr = formatTimeUntil(next.timeUntilAiring);
		airing.insertAdjacentHTML(
			"beforeend",
			`<span>episode ${escapeHtml(next.episode)} airing in ${escapeHtml(timeStr)}</span>`,
		);
	}

	genres.replaceChildren();
	if (media.genres && media.genres.length > 0) {
		genres.insertAdjacentHTML(
			"beforeend",
			media.genres
				.map(
					(g) =>
						`<span class="anime-modal-genre">${escapeHtml(g.toLowerCase())}</span>`,
				)
				.join(""),
		);
	}

	const cleanedDesc = (media.description || "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]*>/g, "");
	synopsis.textContent = decodeEntities(cleanedDesc);

	anilistLink.href = `https://anilist.co/anime/${encodeURIComponent(media.id)}`;

	const trailerUrl = getTrailerUrl(media.trailer);
	if (trailerUrl) {
		trailerLink.href = trailerUrl;
		trailerLink.style.display = "";
	} else {
		trailerLink.style.display = "none";
	}

	overlay.classList.add("active");
	document.body.style.overflow = "hidden";
}

function showCharacterModal(characterId) {
	const chars = anilistData?.favouriteCharacters || [];
	const char = chars.find((c) => c.id === characterId);
	if (!char) return;

	const overlay = document.getElementById("anime-modal-overlay");
	const coverImg = document.getElementById("modal-cover");
	const title = document.getElementById("modal-title");
	const meta = document.getElementById("modal-meta");
	const score = document.getElementById("modal-score");
	const details = document.getElementById("modal-details");
	const dates = document.getElementById("modal-dates");
	const genres = document.getElementById("modal-genres");
	const airing = document.getElementById("modal-airing");
	const synopsis = document.getElementById("modal-synopsis");
	const anilistLink = document.getElementById("modal-anilist-link");
	const trailerLink = document.getElementById("modal-trailer-link");

	if (char.image) {
		coverImg.src = char.image.large || char.image.medium;
		coverImg.alt = char.name.full;
		coverImg.style.display = "block";
	} else {
		coverImg.style.display = "none";
	}

	title.textContent = char.name.full;

	const altNames = [];
	if (char.name.native) altNames.push(char.name.native);
	if (char.name.alternative) {
		for (const name of char.name.alternative) {
			if (name) altNames.push(name);
		}
	}
	const spoilerNames = (char.name.alternativeSpoiler || []).filter(Boolean);

	meta.replaceChildren();
	if (altNames.length > 0 || spoilerNames.length > 0) {
		const namePieces = [];
		if (altNames.length > 0) {
			namePieces.push(altNames.map(escapeHtml).join(", "));
		}
		if (spoilerNames.length > 0) {
			namePieces.push(
				spoilerNames
					.map(
						(name) =>
							`<span class="name-spoiler" data-action="reveal-spoiler">${escapeHtml(name)}</span>`,
					)
					.join(", "),
			);
		}
		meta.insertAdjacentHTML(
			"beforeend",
			`<span class="character-alt-names">${namePieces.join(", ")}</span>`,
		);
	}

	const charDetails = [];
	if (char.dateOfBirth && (char.dateOfBirth.month || char.dateOfBirth.day)) {
		let birthday = "";
		if (char.dateOfBirth.month) birthday += MONTH_NAMES[char.dateOfBirth.month];
		if (char.dateOfBirth.day) birthday += ` ${char.dateOfBirth.day}`;
		if (char.dateOfBirth.year) birthday += `, ${char.dateOfBirth.year}`;
		charDetails.push(`birthday: ${birthday.trim()}`);
	}
	if (char.age) {
		const isInitialAge = char.age.endsWith("-");
		const age = char.age.replace(/-$/, "");
		charDetails.push(`${isInitialAge ? "initial age" : "age"}: ${age}`);
	}
	if (char.gender) charDetails.push(`gender: ${char.gender}`);
	if (char.bloodType) charDetails.push(`blood type: ${char.bloodType}`);

	score.replaceChildren();
	details.replaceChildren();
	airing.replaceChildren();
	setHtmlList(dates, charDetails);
	genres.replaceChildren();
	trailerLink.style.display = "none";

	const rawDesc = (char.description || "")
		.replace(/__(.+?)__/g, "$1")
		.replace(/\*\*(.+?)\*\*/g, "$1")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<[^>]*>/g, "")
		.replace(
			/^(Height|Weight|Birthday|Age|Gender|Blood Type|Bust|Waist|Hip|BWH|Measurements|Eye Color|Hair Color|Race|Species|Affiliation|Occupation|Rank|Status|VA|CV|Seiyuu|Source):?\s*[^\n]*\n?/gim,
			"",
		)
		.trim();

	synopsis.replaceChildren();
	if (!rawDesc) {
		synopsis.textContent = "no description available";
	} else {
		const parts = rawDesc.split(/~!([\s\S]*?)!~/g);
		for (let i = 0; i < parts.length; i++) {
			const text = decodeEntities(parts[i].trim());
			if (!text) continue;
			if (i % 2 === 0) {
				appendTextWithLinks(synopsis, text);
			} else {
				const spoiler = document.createElement("span");
				spoiler.className = "desc-spoiler";
				spoiler.dataset.action = "reveal-spoiler";
				appendTextWithLinks(spoiler, text);
				synopsis.appendChild(spoiler);
			}
		}
	}

	anilistLink.href =
		char.siteUrl ||
		`https://anilist.co/character/${encodeURIComponent(char.id)}`;

	overlay.classList.add("active");
	document.body.style.overflow = "hidden";
}

function renderFavouriteCharacters(chars) {
	if (!chars || chars.length === 0) return "";
	const items = chars
		.map((char) => {
			const name = escapeHtml(char.name.full);
			const native = char.name.native ? escapeHtml(char.name.native) : "";
			const img = char.image ? char.image.large || char.image.medium : null;
			return `
			<div class="anime-grid-item character-grid-item" data-character-id="${escapeHtml(char.id)}">
				<div class="anime-grid-cover">
					${img ? `<img src="${escapeHtml(img)}" alt="${name}" loading="lazy" onerror="this.style.display='none'" />` : ""}
				</div>
				<div class="anime-grid-info">
					<div class="anime-grid-title">${name}</div>
					${native ? `<div class="anime-grid-meta"><span>${native}</span></div>` : ""}
				</div>
			</div>
		`;
		})
		.join("");

	return `
		<div class="all-anime">
			<div class="section-header">
				<h4>favourite characters</h4>
				<span class="section-count">(${chars.length})</span>
			</div>
			<div class="anime-grid">${items}</div>
		</div>
	`;
}

function renderSection(titleText, items, renderFn, count) {
	if (!items || items.length === 0) return "";
	const body = items.map(renderFn).join("");
	return `
		<div class="all-anime">
			<div class="section-header">
				<h4>${escapeHtml(titleText)}</h4>
				<span class="section-count">(${escapeHtml(count ?? items.length)})</span>
			</div>
			<div class="anime-grid">${body}</div>
		</div>
	`;
}

function renderFollowing(users) {
	if (!users || users.length === 0) return "";
	const items = users
		.map((user) => {
			const avatar = user.avatar
				? user.avatar.large || user.avatar.medium
				: null;
			const name = escapeHtml(user.name);
			const siteUrl = safeUrl(user.siteUrl) || "#";
			const count = user.statistics?.anime?.count;
			const mean = user.statistics?.anime?.meanScore;
			return `
			<a href="${escapeHtml(siteUrl)}" class="following-card" target="_blank" rel="noopener noreferrer">
				<div class="following-avatar">
					${avatar ? `<img src="${escapeHtml(avatar)}" alt="${name}" loading="lazy" onerror="this.style.display='none'" />` : ""}
				</div>
				<div class="following-info">
					<div class="following-name">${name}</div>
					<div class="following-stats">
						${count ? `<span>${escapeHtml(count)} anime</span>` : ""}
						${mean ? `<span>★ ${escapeHtml((mean / 10).toFixed(1))}</span>` : ""}
					</div>
				</div>
			</a>
		`;
		})
		.join("");

	return `
		<div class="all-anime">
			<div class="section-header">
				<h4>following</h4>
				<span class="section-count">(${users.length})</span>
			</div>
			<div class="following-grid">${items}</div>
		</div>
	`;
}

function renderUserProfile(user) {
	if (!user) return "";
	const name = escapeHtml(user.name);
	const memberSince = user.createdAt
		? escapeHtml(new Date(user.createdAt * 1000).toLocaleDateString())
		: null;

	return `
		<div class="user-profile-section">
			<div class="section-header">
				<h4>profile</h4>
			</div>
			<div class="profile-stats">
				<div class="profile-stat">
					<span class="profile-label">username</span>
					<span class="profile-value">${name}</span>
				</div>
				${
					memberSince
						? `<div class="profile-stat">
					<span class="profile-label">member since</span>
					<span class="profile-value">${memberSince}</span>
				</div>`
						: ""
				}
			</div>
		</div>
	`;
}

function renderStats(data) {
	const container = document.getElementById("anilist-stats");
	if (!container) return;
	const stats = data.statistics;

	const html = `
		<div class="stats-bar">
			<div class="stats-bar-item">
				<span class="stats-bar-value">${Math.round(stats.daysWatched)}</span>
				<span class="stats-bar-label">days watched</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${escapeHtml(stats.totalEpisodes.toLocaleString())}</span>
				<span class="stats-bar-label">episodes</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${escapeHtml((stats.meanScore / 10).toFixed(1))}</span>
				<span class="stats-bar-label">mean score</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${escapeHtml(stats.totalAnime)}</span>
				<span class="stats-bar-label">total</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${escapeHtml(stats.completed)}</span>
				<span class="stats-bar-label">completed</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${escapeHtml(stats.watching)}</span>
				<span class="stats-bar-label">watching</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${escapeHtml(stats.onHold)}</span>
				<span class="stats-bar-label">on hold</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${escapeHtml(stats.dropped)}</span>
				<span class="stats-bar-label">dropped</span>
			</div>
			<div class="stats-bar-item">
				<span class="stats-bar-value">${escapeHtml(stats.planToWatch)}</span>
				<span class="stats-bar-label">plan to watch</span>
			</div>
		</div>

		${renderFavouriteCharacters(data.favouriteCharacters)}

		${
			data.watching.length > 0
				? `
		<div class="currently-watching">
			<div class="section-header">
				<h4>currently watching</h4>
				<span class="section-count">(${data.watching.length})</span>
			</div>
			<div class="anime-carousel">
				${data.watching.slice(0, 15).map(renderAnimeCard).join("")}
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
				<input type="text" id="anime-search-input" class="search-input" placeholder="search completed anime..." />
			</div>
			<div class="anime-grid" id="all-anime-grid"></div>
			<div class="pagination" id="anime-pagination"></div>
		</div>
		`
				: ""
		}

		${renderSection("on hold", data.onHold, (item) => renderAnimeGridItem(item))}

		${renderSection(
			"plan to watch",
			(data.planToWatch || []).slice(0, 30),
			(item) =>
				renderAnimeGridItem(item, { showScore: false, showDate: false }),
			(data.planToWatch || []).length,
		)}

		${renderSection("dropped", data.dropped, (item) => renderAnimeGridItem(item))}

		${renderFollowing(data.following)}

		${renderUserProfile(data.user)}
	`;

	container.replaceChildren();
	container.insertAdjacentHTML("beforeend", html);

	completedGrid.setData(data.completed);

	if (data.activities && data.activities.length > 0) {
		activityData = data.activities;
		createActivityModal();
		createActivityFab(data.activities.length);
	}
}

function showError(container, message) {
	container.replaceChildren();
	const errorDiv = document.createElement("div");
	errorDiv.className = "error-message";
	const title = document.createElement("h3");
	title.textContent = "unable to load anime stats";
	const messageEl = document.createElement("p");
	messageEl.textContent = message;
	errorDiv.appendChild(title);
	errorDiv.appendChild(messageEl);
	container.appendChild(errorDiv);
	container.style.display = "block";
	container.style.opacity = "1";
}

function wireDelegation(container) {
	delegate(container, "click", ".anime-card, .anime-grid-item", (_e, el) => {
		if (el.matches(".character-grid-item")) {
			const charId = el.dataset.characterId;
			if (charId) showCharacterModal(Number(charId));
			return;
		}
		const animeId = el.dataset.animeId;
		if (animeId) showAnimeModal(Number(animeId));
	});

	delegate(container, "input", "#anime-search-input", (e) => {
		completedGrid.filter(e.target.value);
	});

	completedGrid.attach(container);

	delegate(document.body, "click", "[data-action=open-activity-modal]", () => {
		openActivityModal();
	});
	delegate(document.body, "click", "[data-action=close-activity-modal]", () => {
		closeModal("activity-modal-overlay");
	});
	delegate(document.body, "click", "[data-action=close-anime-modal]", () => {
		closeModal("anime-modal-overlay");
	});
	delegate(document.body, "click", "[data-action=reveal-spoiler]", (_e, el) => {
		el.classList.toggle("revealed");
	});
	delegate(
		document.body,
		"click",
		".activity-item.activity-media",
		(_e, el) => {
			const animeId = el.dataset.animeId;
			if (!animeId) return;
			closeModal("activity-modal-overlay");
			showAnimeModal(Number.parseInt(animeId, 10));
		},
	);

	document.addEventListener("keydown", (e) => {
		if (e.key !== "Escape") return;
		closeModal("anime-modal-overlay");
		closeModal("activity-modal-overlay");
	});
}

async function init() {
	const container = document.getElementById("anilist-stats");
	if (!container) return;

	wireDelegation(container);

	try {
		const response = await fetch("/api/anilist/stats");
		if (!response.ok) throw new Error("Failed to fetch stats");
		const data = await response.json();
		if (data.error) {
			showError(container, data.error);
			return;
		}
		anilistData = data;
		buildAnimeIndex(data);
		container.style.display = "block";
		createAnimeModal();
		renderStats(data);
		requestAnimationFrame(() => {
			container.style.opacity = "1";
		});
	} catch {
		showError(container, "Failed to load anime stats");
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
	init();
}
