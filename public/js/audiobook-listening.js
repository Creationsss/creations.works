import { createPoller } from "./utils/poller.js";
import { formatTimeRemaining } from "./utils/time.js";

function updateAudiobookListening(data) {
	const container = document.getElementById("audiobook-listening");
	if (!container) return;

	if (!data?.isListening || !data.book) {
		container.classList.remove("visible");
		return;
	}

	const book = data.book;
	const cover = container.querySelector(".audiobook-listening-cover");
	const title = container.querySelector(".audiobook-listening-title");
	const author = container.querySelector(".audiobook-listening-author");
	const progressBar = container.querySelector(
		".audiobook-listening-progress-fill",
	);
	const timeInfo = container.querySelector(".audiobook-listening-time");

	if (title) title.textContent = book.title;
	if (author) author.textContent = book.author;

	if (cover) {
		cover.src = book.cover || "/public/assets/default-book.svg";
		cover.alt = book.title;
	}

	if (progressBar) {
		const progressPercent = Math.min(book.progress * 100, 100);
		progressBar.style.width = `${progressPercent}%`;
	}

	if (timeInfo) {
		const progressPercent = Math.round(book.progress * 100);
		const remaining = formatTimeRemaining(book.currentTime, book.duration);
		timeInfo.textContent = `${progressPercent}% · ${remaining}`;
	}

	container.classList.add("visible");
}

createPoller({
	url: "/api/audiobookshelf/listening",
	update: updateAudiobookListening,
});
