import { createPoller } from "./utils/poller.js";
import { formatTimeRemaining } from "./utils/time.js";

function clearAudiobookListening(container) {
	const cover = container.querySelector(".audiobook-listening-cover");
	const title = container.querySelector(".audiobook-listening-title");
	const author = container.querySelector(".audiobook-listening-author");
	const progressBar = container.querySelector(
		".audiobook-listening-progress-fill",
	);
	const timeInfo = container.querySelector(".audiobook-listening-time");

	if (cover) {
		cover.src = "/public/assets/default-book.svg";
		cover.alt = "";
	}
	if (title) title.textContent = "";
	if (author) author.textContent = "";
	if (progressBar) progressBar.style.width = "0%";
	if (timeInfo) timeInfo.textContent = "";
}

function updateAudiobookListening(data) {
	const container = document.getElementById("audiobook-listening");
	if (!container) return;

	if (!data?.isListening || !data.book) {
		container.classList.remove("visible");
		clearAudiobookListening(container);
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
		const ratio = Number.isFinite(book.progress) ? book.progress : 0;
		const progressPercent = Math.max(0, Math.min(ratio * 100, 100));
		progressBar.style.width = `${progressPercent}%`;
	}

	if (timeInfo) {
		const ratio = Number.isFinite(book.progress) ? book.progress : 0;
		const progressPercent = Math.max(0, Math.min(Math.round(ratio * 100), 100));
		const remaining = formatTimeRemaining(book.currentTime, book.duration);
		timeInfo.textContent = `${progressPercent}% · ${remaining}`;
	}

	container.classList.add("visible");
}

createPoller({
	url: "/api/audiobookshelf/listening",
	update: updateAudiobookListening,
});
