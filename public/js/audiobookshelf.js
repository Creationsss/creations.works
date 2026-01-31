let audiobookshelfData = null;
let audiobookshelfError = null;

fetch("/api/audiobookshelf/stats")
	.then((response) => {
		if (!response.ok) throw new Error("Failed to fetch stats");
		return response.json();
	})
	.then((data) => {
		if (data.error) {
			audiobookshelfError = data.error;
			return;
		}
		audiobookshelfData = data;
	})
	.catch(() => {
		audiobookshelfError = "Failed to load audiobook stats";
	});

let audiobookshelfPollCount = 0;
const MAX_POLL_ATTEMPTS = 200;

function updateAudiobookshelfStats() {
	const statsContainer = document.getElementById("audiobookshelf-stats");

	if (audiobookshelfError) {
		if (statsContainer) {
			statsContainer.innerHTML = `
				<div class="error-message">
					<h3>unable to load audiobook stats</h3>
					<p>${audiobookshelfError}</p>
				</div>
			`;
			statsContainer.style.opacity = "1";
		}
		return;
	}

	if (audiobookshelfData) {
		if (!statsContainer) return;
		statsContainer.style.display = "block";
		renderAudiobookshelfStats(audiobookshelfData);
		setTimeout(() => {
			statsContainer.style.opacity = "1";
		}, 10);
		return;
	}

	audiobookshelfPollCount++;
	if (audiobookshelfPollCount < MAX_POLL_ATTEMPTS) {
		setTimeout(updateAudiobookshelfStats, 50);
	}
}

function renderAudiobookshelfStats(data) {
	const container = document.getElementById("audiobookshelf-stats");

	const totalHours = Math.round(data.totalTime / 3600);
	const totalDays = Math.round(data.totalTime / 86400);
	const totalBooks = data.totalBooks || 0;
	const mediaProgress = data.mediaProgress || [];
	const books = Object.values(data.items || {});
	const booksFinished = mediaProgress.filter(
		(progress) => progress.isFinished,
	).length;
	const booksInProgress = mediaProgress.filter(
		(progress) => !progress.isFinished && progress.progress > 0,
	).length;
	const fallbackFinished = books.filter((book) => {
		if (book.mediaMetadata?.duration && book.mediaMetadata.duration > 0) {
			const progress = (book.timeListening / book.mediaMetadata.duration) * 100;
			return progress >= 95;
		}
		const hoursListened = book.timeListening / 3600;
		return hoursListened >= 20;
	}).length;

	const fallbackInProgress = books.filter((book) => {
		if (book.mediaMetadata?.duration && book.mediaMetadata.duration > 0) {
			const progress = (book.timeListening / book.mediaMetadata.duration) * 100;
			return progress > 0 && progress < 95;
		}
		const hoursListened = book.timeListening / 3600;
		return hoursListened > 0 && hoursListened < 20;
	}).length;
	const finalBooksFinished =
		mediaProgress.length > 0 ? booksFinished : fallbackFinished;
	const finalBooksInProgress =
		mediaProgress.length > 0 ? booksInProgress : fallbackInProgress;
	const booksStarted = finalBooksFinished + finalBooksInProgress;
	const completionRate =
		booksStarted > 0
			? Math.round((finalBooksFinished / booksStarted) * 100)
			: 0;
	const uniqueAuthors = new Set();
	const uniqueSeries = new Set();
	const uniqueGenres = new Set();
	const publishers = new Set();
	const seriesStats = {};

	const dailyStats = {};
	const sessionsForDailyStats = data.recentSessions || [];

	sessionsForDailyStats.forEach((session) => {
		const date = session.date;
		if (!dailyStats[date]) {
			dailyStats[date] = 0;
		}
		dailyStats[date] += session.timeListening || 0;
	});

	const dailyTimes = Object.values(dailyStats);
	const bestDaySeconds = dailyTimes.length > 0 ? Math.max(...dailyTimes) : 0;
	const bestDayHours = Math.floor(bestDaySeconds / 3600);
	const bestDayMinutes = Math.floor((bestDaySeconds % 3600) / 60);
	const bestDayTime =
		bestDayMinutes > 0
			? `${bestDayHours}h ${bestDayMinutes}m`
			: `${bestDayHours}h`;

	const todaySeconds = data.today || 0;
	const todayHours = Math.floor(todaySeconds / 3600);
	const todayMinutes = Math.floor((todaySeconds % 3600) / 60);
	const todayTime =
		todayMinutes > 0 ? `${todayHours}h ${todayMinutes}m` : `${todayHours}h`;

	const accountCreated = data.user?.createdAt
		? new Date(data.user.createdAt)
		: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
	const daysSinceCreated = Math.max(
		1,
		Math.floor((Date.now() - accountCreated.getTime()) / (24 * 60 * 60 * 1000)),
	);
	const avgDaySeconds = data.totalTime / daysSinceCreated;
	const avgDayHours = Math.floor(avgDaySeconds / 3600);
	const avgDayMinutes = Math.floor((avgDaySeconds % 3600) / 60);
	const avgDayTime =
		avgDayMinutes > 0 ? `${avgDayHours}h ${avgDayMinutes}m` : `${avgDayHours}h`;

	books.forEach((book) => {
		if (book.mediaMetadata?.authors) {
			book.mediaMetadata.authors.forEach((author) => {
				uniqueAuthors.add(author.name);
			});
		}
		if (book.mediaMetadata?.series) {
			book.mediaMetadata.series.forEach((series) => {
				uniqueSeries.add(series.name);
				if (!seriesStats[series.name]) {
					seriesStats[series.name] = {
						time: 0,
						books: 0,
						id: series.id,
						coverUrls: [],
					};
				}
				seriesStats[series.name].time += book.timeListening;
				seriesStats[series.name].books += 1;
				if (
					book.coverUrl &&
					!seriesStats[series.name].coverUrls.includes(book.coverUrl)
				) {
					seriesStats[series.name].coverUrls.push(book.coverUrl);
				}
			});
		}
		if (book.mediaMetadata?.genres) {
			for (const genre of book.mediaMetadata.genres) {
				uniqueGenres.add(genre);
			}
		}
		if (book.mediaMetadata?.publisher) {
			publishers.add(book.mediaMetadata.publisher);
		}
	});

	const allFinishedBooks = [];

	const finishedItems = mediaProgress.filter((progress) => progress.isFinished);

	finishedItems.forEach((progressItem) => {
		const book = data.items[progressItem.libraryItemId];
		if (!book) return;

		const bookData = {
			title: book.mediaMetadata?.title || "Unknown Title",
			author: book.mediaMetadata?.authors?.[0]?.name || "Unknown Author",
			coverUrl: book.coverUrl,
			finishedAt: progressItem.finishedAt,
			id: progressItem.libraryItemId,
			series: book.mediaMetadata?.series?.[0] || null,
		};

		allFinishedBooks.push(bookData);
	});

	allFinishedBooks.sort((a, b) => {
		const aDate = a.finishedAt && a.finishedAt > 0 ? a.finishedAt : 0;
		const bDate = b.finishedAt && b.finishedAt > 0 ? b.finishedAt : 0;

		if (aDate && bDate) {
			return bDate - aDate;
		}
		if (aDate && !bDate) return -1;
		if (!aDate && bDate) return 1;

		return a.title.localeCompare(b.title);
	});

	let currentlyReading = [];

	if (mediaProgress.length > 0) {
		const inProgressItems = mediaProgress
			.filter(
				(progress) =>
					!progress.isFinished &&
					progress.progress > 0 &&
					!progress.hideFromContinueListening &&
					data.items[progress.libraryItemId],
			)
			.sort((a, b) => b.lastUpdate - a.lastUpdate)
			.slice(0, 5);
		const seenTitles = new Set();

		currentlyReading = inProgressItems
			.map((progressItem) => {
				const book = data.items[progressItem.libraryItemId];

				const title = book.mediaMetadata?.title || "Unknown Title";
				if (seenTitles.has(title)) return null;
				seenTitles.add(title);

				const progressPercent = Math.round(progressItem.progress * 100);
				const remainingSeconds = Math.max(
					0,
					progressItem.duration - progressItem.currentTime,
				);
				const remainingHours = Math.floor(remainingSeconds / 3600);
				const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
				const timeRemaining =
					progressItem.duration > 0
						? remainingMinutes > 0
							? `${remainingHours}h ${remainingMinutes}m`
							: `${remainingHours}h`
						: "0h";

				return {
					title,
					author: book.mediaMetadata?.authors?.[0]?.name || "Unknown Author",
					series: book.mediaMetadata?.series?.[0]?.name || null,
					progress: Math.min(Math.max(progressPercent, 0), 100),
					timeRemaining,
					totalHours: Math.round(progressItem.currentTime / 3600),
					coverUrl: book.coverUrl,
					description: book.mediaMetadata?.description || null,
					id: progressItem.libraryItemId,
				};
			})
			.filter((item) => item !== null);

		currentlyReadingBooks = currentlyReading;
	} else {
		const seenTitles = new Set();
		currentlyReading = books
			.filter((book) => {
				if (book.mediaMetadata?.duration && book.mediaMetadata.duration > 0) {
					const progress =
						(book.timeListening / book.mediaMetadata.duration) * 100;
					return progress > 0 && progress < 90;
				}
				const hoursListened = book.timeListening / 3600;
				return hoursListened > 0 && hoursListened < 8;
			})
			.sort((a, b) => b.timeListening - a.timeListening)
			.map((book) => {
				const title = book.mediaMetadata?.title || "Unknown Title";
				if (seenTitles.has(title)) return null;
				seenTitles.add(title);

				let progress = 0;
				let timeRemaining = "0h";

				if (book.mediaMetadata?.duration && book.mediaMetadata.duration > 0) {
					progress = Math.round(
						(book.timeListening / book.mediaMetadata.duration) * 100,
					);
					const remainingSeconds = Math.max(
						0,
						book.mediaMetadata.duration - book.timeListening,
					);
					const remainingHours = Math.floor(remainingSeconds / 3600);
					const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
					timeRemaining =
						remainingMinutes > 0
							? `${remainingHours}h ${remainingMinutes}m`
							: `${remainingHours}h`;
				} else {
					const estimatedDuration = 12 * 3600;
					progress = Math.round((book.timeListening / estimatedDuration) * 100);
					const remainingSeconds = Math.max(
						0,
						estimatedDuration - book.timeListening,
					);
					const remainingHours = Math.floor(remainingSeconds / 3600);
					const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
					timeRemaining =
						remainingMinutes > 0
							? `${remainingHours}h ${remainingMinutes}m`
							: `${remainingHours}h`;
				}

				return {
					title,
					author: book.mediaMetadata?.authors?.[0]?.name || "Unknown Author",
					series: book.mediaMetadata?.series?.[0]?.name || null,
					progress: Math.min(Math.max(progress, 0), 100),
					timeRemaining,
					totalHours: Math.round(book.timeListening / 3600),
					coverUrl: book.coverUrl,
					description: book.mediaMetadata?.description || null,
					id: book.id,
				};
			})
			.filter((item) => item !== null)
			.slice(0, 5);

		currentlyReadingBooks = currentlyReading;
	}

	const recentSessions = (data.recentSessions || [])
		.filter((session) => {
			const totalMinutes = Math.round(session.timeListening / 60);
			return totalMinutes > 0;
		})
		.slice(0, 8)
		.map((session) => {
			const totalMinutes = Math.round(session.timeListening / 60);
			const hours = Math.floor(totalMinutes / 60);
			const minutes = totalMinutes % 60;

			let durationText;
			if (hours > 0) {
				durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
			} else {
				durationText = `${minutes}m`;
			}

			return {
				title:
					session.displayTitle || session.mediaMetadata?.title || "Unknown",
				author:
					session.displayAuthor ||
					session.mediaMetadata?.authors?.[0]?.name ||
					"Unknown",
				duration: durationText,
				date: new Date(session.date).toLocaleDateString(),
				device:
					session.deviceInfo?.deviceName ||
					session.deviceInfo?.clientName ||
					"Unknown Device",
			};
		});

	const statsHTML = `
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

		${
			currentlyReading.length
				? `
		<div class="currently-reading">
			<h4>currently reading</h4>
			<div class="reading-list">
				${currentlyReading
					.map(
						(book) => `
					<div class="reading-item" data-book-id="${book.id || ""}" onmouseenter="loadBookDescription(this)" onmouseleave="clearBookTimeout()">
						${
							book.coverUrl
								? `<div class="book-cover">
							<img src="${book.coverUrl}" alt="${book.title} cover" loading="lazy" onerror="this.style.display='none'">
						</div>`
								: ""
						}
						<div class="book-content">
							<div class="book-info">
								<span class="book-title">${book.title}</span>
								<span class="book-author">by ${book.author}</span>
								${book.series ? `<span class="book-series">${book.series}</span>` : ""}
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
									book.timeRemaining !== "0h"
										? `<span class="time-remaining"><span class="stat-value">${book.timeRemaining}</span> left</span>`
										: ""
								}
							</div>
						</div>
						<div class="book-description" style="display: none;"></div>
					</div>
				`,
					)
					.join("")}
			</div>
		</div>
		`
				: ""
		}

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
				<span class="stat-number"><span class="stat-value">${todayTime}</span></span>
				<span class="stat-label">today</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${bestDayTime}</span></span>
				<span class="stat-label">best day</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${avgDayTime}</span></span>
				<span class="stat-label">avg per day</span>
			</div>
			<div class="audiobook-stat">
				<span class="stat-number"><span class="stat-value">${Math.round(finalBooksFinished / Math.max(daysSinceCreated / 30, 1))}</span></span>
				<span class="stat-label">books/month</span>
			</div>
		</div>

		${
			data.user
				? `
		<div class="user-profile-section">
			<h4>profile information</h4>
			<div class="profile-stats">
				<div class="profile-stat">
					<span class="profile-label">member since:</span>
					<span class="profile-value">${new Date(data.user.createdAt).toLocaleDateString()}</span>
				</div>
				<div class="profile-stat">
					<span class="profile-label">last active:</span>
					<span class="profile-value">${new Date(data.user.lastSeen).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
		`
				: ""
		}

		${
			allFinishedBooks.length > 0
				? `
		<div class="all-books">
			<h4>finished books</h4>
			<div class="book-search">
				<input type="text" id="book-search-input" class="search-input" placeholder="search books..." oninput="filterBooks()">
			</div>
			<div class="books-grid" id="all-books-grid"></div>
			<div class="pagination" id="books-pagination"></div>
		</div>
		`
				: ""
		}

		${
			recentSessions.length
				? `
		<div class="recent-sessions">
			<h4>recent listening sessions</h4>
			<div class="sessions-list">
				${recentSessions
					.map(
						(session) => `
					<div class="session-item">
						<div class="session-info">
							<span class="session-title">${session.title}</span>
							<span class="session-author">${session.author}</span>
						</div>
						<div class="session-meta">
							<span class="session-duration">${session.duration}</span>
							<span class="session-date">${session.date}</span>
							<span class="session-device">${session.device}</span>
						</div>
					</div>
				`,
					)
					.join("")}
			</div>
		</div>
		`
				: ""
		}
	`;

	container.innerHTML = statsHTML;

	allFinishedBooksData = allFinishedBooks;
	currentPage = 1;
	renderBooksPage();
}

function renderBookItem(book) {
	return `
		<div class="book-grid-item" data-title="${book.title.toLowerCase()}" data-author="${book.author.toLowerCase()}" data-series="${(book.series?.name || "").toLowerCase()}">
			${
				book.coverUrl
					? `<div class="book-grid-cover">
				<img src="${book.coverUrl}" alt="${book.title} cover" loading="lazy" onerror="this.style.display='none'">
			</div>`
					: ""
			}
			<div class="book-grid-info">
				<span class="book-grid-title">${book.title}</span>
				<span class="book-grid-author">by ${book.author}</span>
				${book.series ? `<span class="book-grid-series">${book.series.name}</span>` : ""}
				${book.finishedAt && book.finishedAt > 0 ? `<span class="book-grid-stats">finished ${new Date(book.finishedAt).toLocaleDateString()}</span>` : ""}
			</div>
		</div>
	`;
}

function renderBooksPage() {
	const grid = document.getElementById("all-books-grid");
	const pagination = document.getElementById("books-pagination");
	if (!grid) return;

	const totalPages = Math.ceil(allFinishedBooksData.length / BOOKS_PER_PAGE);
	const start = (currentPage - 1) * BOOKS_PER_PAGE;
	const pageBooks = allFinishedBooksData.slice(start, start + BOOKS_PER_PAGE);

	grid.innerHTML = pageBooks.map(renderBookItem).join("");

	if (pagination && totalPages > 1) {
		pagination.style.display = "";
		pagination.innerHTML = `
			<button class="pagination-btn" onclick="goToBookPage(${currentPage - 1})" ${currentPage <= 1 ? "disabled" : ""}>prev</button>
			<span class="pagination-info">${currentPage} / ${totalPages}</span>
			<button class="pagination-btn" onclick="goToBookPage(${currentPage + 1})" ${currentPage >= totalPages ? "disabled" : ""}>next</button>
		`;
	} else if (pagination) {
		pagination.style.display = "none";
	}
}

// biome-ignore lint/correctness/noUnusedVariables: Called from HTML onclick attribute
function goToBookPage(page) {
	const totalPages = Math.ceil(allFinishedBooksData.length / BOOKS_PER_PAGE);
	if (page < 1 || page > totalPages) return;
	currentPage = page;
	renderBooksPage();

	const grid = document.getElementById("all-books-grid");
	if (grid) {
		grid.scrollIntoView({ behavior: "smooth", block: "start" });
	}
}

let bookDescriptionTimeout;
let currentlyReadingBooks = [];
let allFinishedBooksData = [];
let currentPage = 1;
const BOOKS_PER_PAGE = 24;

// biome-ignore lint/correctness/noUnusedVariables: Called from HTML onmouseenter attribute
function loadBookDescription(bookElement) {
	const bookId = bookElement.dataset.bookId;
	if (!bookId) return;

	clearTimeout(bookDescriptionTimeout);

	const descriptionDiv = bookElement.querySelector(".book-description");

	addDimmingOverlay();

	descriptionDiv.innerHTML = `
		<div class="skeleton-line skeleton long"></div>
		<div class="skeleton-line skeleton medium"></div>
		<div class="skeleton-line skeleton short"></div>
	`;
	descriptionDiv.style.display = "block";
	descriptionDiv.classList.add("show");

	bookDescriptionTimeout = setTimeout(() => {
		const bookData = currentlyReadingBooks.find((book) => book.id === bookId);

		if (bookData?.description) {
			descriptionDiv.innerHTML = bookData.description;
		} else {
			descriptionDiv.innerHTML = "<p>no description available</p>";
		}
	}, 300);
}

function clearBookTimeout() {
	clearTimeout(bookDescriptionTimeout);
	const descriptionDivs = document.querySelectorAll(".book-description");
	descriptionDivs.forEach((div) => {
		div.classList.remove("show");
		setTimeout(() => {
			if (!div.classList.contains("show")) {
				div.style.display = "none";
				div.innerHTML = "";
			}
		}, 300);
	});
	removeDimmingOverlay();
}

// biome-ignore lint/correctness/noUnusedVariables: Called from HTML oninput attribute
function filterBooks() {
	const searchInput = document.getElementById("book-search-input");
	const booksGrid = document.getElementById("all-books-grid");
	const pagination = document.getElementById("books-pagination");

	if (!searchInput || !booksGrid) return;

	const searchTerm = searchInput.value.toLowerCase();

	if (!searchTerm) {
		renderBooksPage();
		return;
	}

	const matched = allFinishedBooksData.filter((book) => {
		const title = book.title.toLowerCase();
		const author = book.author.toLowerCase();
		const series = (book.series?.name || "").toLowerCase();
		return (
			title.includes(searchTerm) ||
			author.includes(searchTerm) ||
			series.includes(searchTerm)
		);
	});

	booksGrid.innerHTML = matched.map(renderBookItem).join("");

	if (pagination) {
		pagination.style.display = "none";
	}
}

function addDimmingOverlay() {
	let overlay = document.querySelector(".description-overlay");
	if (!overlay) {
		overlay = document.createElement("div");
		overlay.className = "description-overlay";
		document.body.appendChild(overlay);
	}
	setTimeout(() => {
		overlay.classList.add("active");
	}, 10);
}

function removeDimmingOverlay() {
	const overlay = document.querySelector(".description-overlay");
	if (overlay) {
		overlay.classList.remove("active");
		setTimeout(() => {
			if (overlay.parentNode && !overlay.classList.contains("active")) {
				overlay.parentNode.removeChild(overlay);
			}
		}, 300);
	}
}

document.addEventListener("click", (e) => {
	const descriptionDiv = document.querySelector(".book-description.show");
	if (descriptionDiv) {
		const bookItem = e.target.closest(".reading-item");
		const clickedDescription = e.target.closest(".book-description");

		if (!bookItem && !clickedDescription) {
			clearBookTimeout();
		}
	}
});

document.addEventListener("DOMContentLoaded", updateAudiobookshelfStats);
