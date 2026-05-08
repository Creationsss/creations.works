import { UI } from "./utils/constants.js";
import { delegate, escapeHtml } from "./utils/dom.js";
import { createPaginatedGrid } from "./utils/pagination.js";
import { formatDuration } from "./utils/time.js";

const BOOKS_PER_PAGE = 24;
const FALLBACK_FINISHED_HOURS = 20;
const FALLBACK_PROGRESS_PERCENT = 95;
const ESTIMATED_BOOK_DURATION_SECONDS = 12 * 3600;

let currentlyReadingBooks = [];
let bookDescriptionFillTimeout = null;
let bookDescriptionClearTimeout = null;

const booksGrid = createPaginatedGrid({
	gridId: "all-books-grid",
	paginationId: "books-pagination",
	pageSize: BOOKS_PER_PAGE,
	renderGrid: (grid, items) => {
		grid.replaceChildren();
		grid.insertAdjacentHTML(
			"beforeend",
			items.map(renderBookGridItem).join(""),
		);
	},
	matchItem: (book, term) => {
		return (
			book.title.toLowerCase().includes(term) ||
			book.author.toLowerCase().includes(term) ||
			(book.series?.name || "").toLowerCase().includes(term)
		);
	},
});

function formatSeriesLabel(series) {
	if (!series?.name) return "";
	return series.sequence ? `${series.name} #${series.sequence}` : series.name;
}

function renderBookGridItem(book) {
	const title = escapeHtml(book.title);
	const author = escapeHtml(book.author);
	const seriesName = book.series
		? escapeHtml(formatSeriesLabel(book.series))
		: "";
	const finishedDate =
		book.finishedAt && book.finishedAt > 0
			? escapeHtml(new Date(book.finishedAt).toLocaleDateString())
			: null;

	return `
		<div class="book-grid-item">
			${
				book.coverUrl
					? `<div class="book-grid-cover">
				<img src="${escapeHtml(book.coverUrl)}" alt="${title} cover" loading="lazy" onerror="this.style.display='none'" />
			</div>`
					: ""
			}
			<div class="book-grid-info">
				<span class="book-grid-title">${title}</span>
				<span class="book-grid-author">by ${author}</span>
				${seriesName ? `<span class="book-grid-series">${seriesName}</span>` : ""}
				${finishedDate ? `<span class="book-grid-stats">finished ${finishedDate}</span>` : ""}
			</div>
		</div>
	`;
}

function countProgress(mediaProgress, books, items) {
	if (mediaProgress.length > 0) {
		let finished = 0;
		let inProgress = 0;
		for (const progress of mediaProgress) {
			if (items && !items[progress.libraryItemId]) continue;
			if (progress.isFinished) finished++;
			else if (progress.progress > 0 && !progress.hideFromContinueListening)
				inProgress++;
		}
		return { finished, inProgress };
	}

	let finished = 0;
	let inProgress = 0;
	for (const book of books) {
		const duration = book.mediaMetadata?.duration;
		if (duration && duration > 0) {
			const progress = (book.timeListening / duration) * 100;
			if (progress >= FALLBACK_PROGRESS_PERCENT) finished++;
			else if (progress > 0) inProgress++;
		} else {
			const hoursListened = book.timeListening / 3600;
			if (hoursListened >= FALLBACK_FINISHED_HOURS) finished++;
			else if (hoursListened > 0) inProgress++;
		}
	}
	return { finished, inProgress };
}

function collectTaxonomy(books) {
	const uniqueAuthors = new Set();
	const uniqueSeries = new Set();
	const uniqueGenres = new Set();
	const publishers = new Set();

	for (const book of books) {
		if (book.mediaMetadata?.authors) {
			for (const author of book.mediaMetadata.authors) {
				uniqueAuthors.add(author.name);
			}
		}
		if (book.mediaMetadata?.series) {
			for (const series of book.mediaMetadata.series) {
				uniqueSeries.add(series.name);
			}
		}
		if (book.mediaMetadata?.genres) {
			for (const genre of book.mediaMetadata.genres) {
				uniqueGenres.add(genre);
			}
		}
		if (book.mediaMetadata?.publisher) {
			publishers.add(book.mediaMetadata.publisher);
		}
	}

	return { uniqueAuthors, uniqueSeries, uniqueGenres, publishers };
}

function buildFinishedBooks(data, mediaProgress) {
	const list = [];
	const seen = new Set();
	for (const progress of mediaProgress) {
		if (!progress.isFinished) continue;
		if (seen.has(progress.libraryItemId)) continue;
		const book = data.items[progress.libraryItemId];
		if (!book) continue;
		seen.add(progress.libraryItemId);

		list.push({
			title: book.mediaMetadata?.title || "Unknown Title",
			author: book.mediaMetadata?.authors?.[0]?.name || "Unknown Author",
			coverUrl: book.coverUrl,
			finishedAt: progress.finishedAt,
			id: progress.libraryItemId,
			series: book.mediaMetadata?.series?.[0] || null,
		});
	}

	list.sort((a, b) => {
		const aDate = a.finishedAt && a.finishedAt > 0 ? a.finishedAt : 0;
		const bDate = b.finishedAt && b.finishedAt > 0 ? b.finishedAt : 0;
		if (aDate && bDate) return bDate - aDate;
		if (aDate) return -1;
		if (bDate) return 1;
		return a.title.localeCompare(b.title);
	});

	return list;
}

function buildCurrentlyReadingFromProgress(data, mediaProgress) {
	const inProgress = mediaProgress
		.filter(
			(p) =>
				!p.isFinished &&
				p.progress > 0 &&
				!p.hideFromContinueListening &&
				data.items[p.libraryItemId],
		)
		.sort((a, b) => b.lastUpdate - a.lastUpdate)
		.slice(0, 5);

	const seen = new Set();
	const out = [];
	for (const p of inProgress) {
		if (seen.has(p.libraryItemId)) continue;
		seen.add(p.libraryItemId);

		const book = data.items[p.libraryItemId];
		const title = book.mediaMetadata?.title || "Unknown Title";

		const progressPercent = Math.round(p.progress * 100);
		const remainingSeconds = Math.max(0, p.duration - p.currentTime);
		const timeRemaining =
			p.duration > 0 && remainingSeconds > 0
				? formatDuration(remainingSeconds)
				: null;

		out.push({
			title,
			author: book.mediaMetadata?.authors?.[0]?.name || "Unknown Author",
			series: formatSeriesLabel(book.mediaMetadata?.series?.[0]) || null,
			progress: Math.min(Math.max(progressPercent, 0), 100),
			timeRemaining,
			totalHours: Math.round(p.currentTime / 3600),
			coverUrl: book.coverUrl,
			description: book.mediaMetadata?.description || null,
			id: p.libraryItemId,
		});
	}
	return out;
}

function buildCurrentlyReadingFromItems(books) {
	const seen = new Set();
	return books
		.filter((book) => {
			const duration = book.mediaMetadata?.duration;
			if (duration && duration > 0) {
				const progress = (book.timeListening / duration) * 100;
				return progress > 0 && progress < 90;
			}
			const hours = book.timeListening / 3600;
			return hours > 0 && hours < 8;
		})
		.sort((a, b) => b.timeListening - a.timeListening)
		.map((book) => {
			if (seen.has(book.id)) return null;
			seen.add(book.id);

			const title = book.mediaMetadata?.title || "Unknown Title";
			const duration = book.mediaMetadata?.duration;
			let progress;
			let remainingSeconds;
			if (duration && duration > 0) {
				progress = Math.round((book.timeListening / duration) * 100);
				remainingSeconds = Math.max(0, duration - book.timeListening);
			} else {
				progress = Math.round(
					(book.timeListening / ESTIMATED_BOOK_DURATION_SECONDS) * 100,
				);
				remainingSeconds = Math.max(
					0,
					ESTIMATED_BOOK_DURATION_SECONDS - book.timeListening,
				);
			}
			const timeRemaining =
				remainingSeconds > 0 ? formatDuration(remainingSeconds) : null;

			return {
				title,
				author: book.mediaMetadata?.authors?.[0]?.name || "Unknown Author",
				series: formatSeriesLabel(book.mediaMetadata?.series?.[0]) || null,
				progress: Math.min(Math.max(progress, 0), 100),
				timeRemaining,
				totalHours: Math.round(book.timeListening / 3600),
				coverUrl: book.coverUrl,
				description: book.mediaMetadata?.description || null,
				id: book.id,
			};
		})
		.filter(Boolean)
		.slice(0, 5);
}

function renderCurrentlyReading(list) {
	if (!list.length) return "";
	const items = list
		.map((book) => {
			const title = escapeHtml(book.title);
			const author = escapeHtml(book.author);
			const series = book.series ? escapeHtml(book.series) : "";
			const timeRemaining = book.timeRemaining
				? escapeHtml(book.timeRemaining)
				: "";
			return `
			<div class="reading-item" data-book-id="${escapeHtml(book.id || "")}">
				${
					book.coverUrl
						? `<div class="book-cover">
					<img src="${escapeHtml(book.coverUrl)}" alt="${title} cover" loading="lazy" onerror="this.style.display='none'" />
				</div>`
						: ""
				}
				<div class="book-content">
					<div class="book-info">
						<span class="book-title">${title}</span>
						<span class="book-author">by ${author}</span>
						${series ? `<span class="book-series">${series}</span>` : ""}
					</div>
					<div class="progress-container">
						<div class="progress-bar">
							<div class="progress-fill" style="width: ${book.progress}%"></div>
						</div>
						<span class="progress-text"><span class="stat-value">${book.progress}%</span></span>
					</div>
					<div class="book-stats">
						<span class="listened-time"><span class="stat-value">${book.totalHours}h</span> listened</span>
						${
							timeRemaining
								? `<span class="time-remaining"><span class="stat-value">${timeRemaining}</span> left</span>`
								: ""
						}
					</div>
				</div>
				<div class="book-description" style="display: none;"></div>
			</div>
		`;
		})
		.join("");

	return `
		<div class="currently-reading">
			<h4>currently reading</h4>
			<div class="reading-list">${items}</div>
		</div>
	`;
}

function parseSessionDate(value) {
	if (typeof value === "number") return new Date(value);
	if (typeof value === "string") {
		const ymd = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (ymd) {
			return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
		}
		const parsed = new Date(value);
		if (!Number.isNaN(parsed.getTime())) return parsed;
	}
	return null;
}

function renderRecentSessions(data) {
	const sessions = (data.recentSessions || [])
		.filter((s) => Math.round(s.timeListening / 60) > 0)
		.slice(0, 8)
		.map((session) => {
			const parsed = parseSessionDate(session.date);
			return {
				title:
					session.displayTitle || session.mediaMetadata?.title || "Unknown",
				author:
					session.displayAuthor ||
					session.mediaMetadata?.authors?.[0]?.name ||
					"Unknown",
				duration: formatDuration(session.timeListening),
				date: parsed ? parsed.toLocaleDateString() : "Unknown",
				device:
					session.deviceInfo?.deviceName ||
					session.deviceInfo?.clientName ||
					"Unknown Device",
			};
		});

	if (!sessions.length) return "";

	const items = sessions
		.map(
			(s) => `
		<div class="session-item">
			<div class="session-info">
				<span class="session-title">${escapeHtml(s.title)}</span>
				<span class="session-author">${escapeHtml(s.author)}</span>
			</div>
			<div class="session-meta">
				<span class="session-duration">${escapeHtml(s.duration)}</span>
				<span class="session-date">${escapeHtml(s.date)}</span>
				<span class="session-device">${escapeHtml(s.device)}</span>
			</div>
		</div>
	`,
		)
		.join("");

	return `
		<div class="recent-sessions">
			<h4>recent listening sessions</h4>
			<div class="sessions-list">${items}</div>
		</div>
	`;
}

function renderUserProfile(user) {
	if (!user) return "";

	const memberSince = user.createdAt
		? escapeHtml(new Date(user.createdAt).toLocaleDateString())
		: null;
	const lastActive = user.lastSeen
		? escapeHtml(new Date(user.lastSeen).toLocaleDateString())
		: null;

	if (!memberSince && !lastActive) return "";

	return `
		<div class="user-profile-section">
			<h4>profile information</h4>
			<div class="profile-stats">
				${
					memberSince
						? `<div class="profile-stat">
					<span class="profile-label">member since:</span>
					<span class="profile-value">${memberSince}</span>
				</div>`
						: ""
				}
				${
					lastActive
						? `<div class="profile-stat">
					<span class="profile-label">last active:</span>
					<span class="profile-value">${lastActive}</span>
				</div>`
						: ""
				}
			</div>
		</div>
	`;
}

function renderStats(data) {
	const container = document.getElementById("audiobookshelf-stats");
	if (!container) return;

	const totalHours = Math.round(data.totalTime / 3600);
	const totalDays = Math.round(data.totalTime / 86400);
	const totalBooks = data.totalBooks || 0;
	const mediaProgress = data.mediaProgress || [];
	const books = Object.values(data.items || {});

	const { finished: finalBooksFinished, inProgress: finalBooksInProgress } =
		countProgress(mediaProgress, books, data.items || {});
	const booksStarted = finalBooksFinished + finalBooksInProgress;
	const completionRate =
		booksStarted > 0
			? Math.round((finalBooksFinished / booksStarted) * 100)
			: 0;

	const { uniqueAuthors, uniqueSeries, uniqueGenres, publishers } =
		collectTaxonomy(books);

	const dailyTimes = Object.values(data.days || {});
	const bestDaySeconds = dailyTimes.length > 0 ? Math.max(...dailyTimes) : 0;
	const bestDayTime = formatDuration(bestDaySeconds);
	const todayTime = formatDuration(data.today || 0);

	const accountCreated = data.user?.createdAt
		? new Date(data.user.createdAt)
		: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
	const daysSinceCreated = Math.max(
		1,
		Math.floor((Date.now() - accountCreated.getTime()) / (24 * 60 * 60 * 1000)),
	);
	const avgDayTime = formatDuration(data.totalTime / daysSinceCreated);
	const booksPerMonth = Math.round(
		(finalBooksFinished * 30) / Math.max(daysSinceCreated, 30),
	);

	const finishedBooks = buildFinishedBooks(data, mediaProgress);
	const fromProgress =
		mediaProgress.length > 0
			? buildCurrentlyReadingFromProgress(data, mediaProgress)
			: [];
	const currentlyReading =
		fromProgress.length > 0
			? fromProgress
			: buildCurrentlyReadingFromItems(books);
	currentlyReadingBooks = currentlyReading;

	const html = `
		<div class="audiobook-grid main-stats">
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${totalDays}</span></span>
				<span class="stat-label">days of listening</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${completionRate}%</span></span>
				<span class="stat-label">completion rate</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${totalHours}h</span></span>
				<span class="stat-label">total hours</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${finalBooksFinished}</span></span>
				<span class="stat-label">books finished</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${finalBooksInProgress}</span></span>
				<span class="stat-label">in progress</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${totalBooks}</span></span>
				<span class="stat-label">total books</span>
			</div>
		</div>

		${renderCurrentlyReading(currentlyReading)}

		<div class="audiobook-grid secondary-stats">
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${uniqueAuthors.size}</span></span>
				<span class="stat-label">authors</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${uniqueSeries.size}</span></span>
				<span class="stat-label">series</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${uniqueGenres.size}</span></span>
				<span class="stat-label">genres</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${publishers.size}</span></span>
				<span class="stat-label">publishers</span>
			</div>
		</div>

		<div class="audiobook-grid daily-stats">
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${escapeHtml(todayTime)}</span></span>
				<span class="stat-label">today</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${escapeHtml(bestDayTime)}</span></span>
				<span class="stat-label">best day</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${escapeHtml(avgDayTime)}</span></span>
				<span class="stat-label">avg per day</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${booksPerMonth}</span></span>
				<span class="stat-label">books/month</span>
			</div>
		</div>

		${renderUserProfile(data.user)}

		${
			finishedBooks.length > 0
				? `
		<div class="all-books">
			<h4>finished books</h4>
			<div class="book-search">
				<input type="text" id="book-search-input" class="search-input" placeholder="search books..." />
			</div>
			<div class="books-grid" id="all-books-grid"></div>
			<div class="pagination" id="books-pagination"></div>
		</div>
		`
				: ""
		}

		${renderRecentSessions(data)}
	`;

	container.replaceChildren();
	container.insertAdjacentHTML("beforeend", html);

	for (const item of container.querySelectorAll(".reading-item")) {
		item.addEventListener("mouseenter", () => showBookDescription(item));
		item.addEventListener("mouseleave", () => hideActiveBookDescription());
	}

	booksGrid.setData(finishedBooks);
}

function showError(container, message) {
	const html = `
		<div class="error-message">
			<h3>unable to load audiobook stats</h3>
			<p>${escapeHtml(message)}</p>
		</div>
	`;
	container.replaceChildren();
	container.insertAdjacentHTML("beforeend", html);
	container.style.opacity = "1";
}

function ensureOverlay() {
	let overlay = document.querySelector(".description-overlay");
	if (!overlay) {
		overlay = document.createElement("div");
		overlay.className = "description-overlay";
		document.body.appendChild(overlay);
	}
	requestAnimationFrame(() => overlay.classList.add("active"));
}

function removeOverlay() {
	const overlay = document.querySelector(".description-overlay");
	if (!overlay) return;
	overlay.classList.remove("active");
	setTimeout(() => {
		if (!overlay.classList.contains("active")) overlay.remove();
	}, UI.DESCRIPTION_DELAY);
}

function showBookDescription(readingItem) {
	const bookId = readingItem.dataset.bookId;
	if (!bookId) return;

	const descriptionDiv = readingItem.querySelector(".book-description");
	if (!descriptionDiv) return;

	for (const other of document.querySelectorAll(".book-description.show")) {
		if (other !== descriptionDiv) {
			other.classList.remove("show");
			other.style.display = "none";
			other.replaceChildren();
		}
	}

	clearTimeout(bookDescriptionFillTimeout);
	clearTimeout(bookDescriptionClearTimeout);

	ensureOverlay();
	descriptionDiv.replaceChildren();
	descriptionDiv.insertAdjacentHTML(
		"beforeend",
		`
		<div class="skeleton-line skeleton long"></div>
		<div class="skeleton-line skeleton medium"></div>
		<div class="skeleton-line skeleton short"></div>
	`,
	);
	descriptionDiv.style.display = "block";
	descriptionDiv.classList.add("show");

	bookDescriptionFillTimeout = setTimeout(() => {
		const bookData = currentlyReadingBooks.find((b) => b.id === bookId);
		descriptionDiv.replaceChildren();
		if (bookData?.description) {
			descriptionDiv.insertAdjacentHTML("beforeend", bookData.description);
		} else {
			const p = document.createElement("p");
			p.textContent = "no description available";
			descriptionDiv.appendChild(p);
		}
	}, UI.DESCRIPTION_DELAY);
}

function hideActiveBookDescription() {
	const active = document.querySelector(".book-description.show");
	if (!active) {
		removeOverlay();
		return;
	}
	active.classList.remove("show");
	clearTimeout(bookDescriptionClearTimeout);
	bookDescriptionClearTimeout = setTimeout(() => {
		if (!active.classList.contains("show")) {
			active.style.display = "none";
			active.replaceChildren();
		}
	}, UI.DESCRIPTION_DELAY);
	removeOverlay();
}

function wireDelegation(container) {
	delegate(container, "input", "#book-search-input", (e) => {
		booksGrid.filter(e.target.value);
	});
	booksGrid.attach(container);

	document.addEventListener("click", (e) => {
		const active = document.querySelector(".book-description.show");
		if (!active) return;
		if (
			!e.target.closest(".reading-item") &&
			!e.target.closest(".book-description")
		) {
			hideActiveBookDescription();
		}
	});
}

async function init() {
	const container = document.getElementById("audiobookshelf-stats");
	if (!container) return;

	wireDelegation(container);

	try {
		const response = await fetch("/api/audiobookshelf/stats");
		let data = null;
		try {
			data = await response.json();
		} catch {
			/* non-JSON body */
		}
		if (!response.ok || data?.error) {
			showError(container, data?.error || "Failed to load audiobook stats");
			return;
		}
		container.style.display = "block";
		renderStats(data);
		requestAnimationFrame(() => {
			container.style.opacity = "1";
		});
	} catch {
		showError(container, "Failed to load audiobook stats");
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
	init();
}
