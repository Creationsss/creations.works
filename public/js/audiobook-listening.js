import { createPoller } from "./utils/poller.js";
import { formatTimeRemaining } from "./utils/time.js";

let cachedRefs = null;

function getRefs() {
	if (cachedRefs?.container.isConnected) return cachedRefs;
	const container = document.getElementById("audiobook-listening");
	if (!container) return null;
	cachedRefs = {
		container,
		cover: container.querySelector(".audiobook-listening-cover"),
		title: container.querySelector(".audiobook-listening-title"),
		author: container.querySelector(".audiobook-listening-author"),
		progressBar: container.querySelector(".audiobook-listening-progress-fill"),
		timeInfo: container.querySelector(".audiobook-listening-time"),
	};
	return cachedRefs;
}

function clearAudiobookListening(refs) {
	if (refs.cover) {
		refs.cover.src = "/public/assets/default-book.svg";
		refs.cover.alt = "";
	}
	if (refs.title) refs.title.textContent = "";
	if (refs.author) refs.author.textContent = "";
	if (refs.progressBar) refs.progressBar.style.width = "0%";
	if (refs.timeInfo) refs.timeInfo.textContent = "";
}

function updateAudiobookListening(data) {
	const refs = getRefs();
	if (!refs) return;

	if (!data?.isListening || !data.book) {
		refs.container.classList.remove("visible");
		clearAudiobookListening(refs);
		return;
	}

	const book = data.book;
	const ratio = Number.isFinite(book.progress) ? book.progress : 0;
	const clampedPercent = Math.max(0, Math.min(ratio * 100, 100));

	if (refs.title) refs.title.textContent = book.title;
	if (refs.author) refs.author.textContent = book.author;

	if (refs.cover) {
		refs.cover.src = book.cover || "/public/assets/default-book.svg";
		refs.cover.alt = book.title;
	}

	if (refs.progressBar) {
		refs.progressBar.style.width = `${clampedPercent}%`;
	}

	if (refs.timeInfo) {
		const remaining = formatTimeRemaining(book.currentTime, book.duration);
		refs.timeInfo.textContent = `${Math.round(clampedPercent)}% · ${remaining}`;
	}

	refs.container.classList.add("visible");
}

createPoller({
	url: "/api/audiobookshelf/listening",
	update: updateAudiobookListening,
});
