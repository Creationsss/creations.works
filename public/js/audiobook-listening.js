(() => {
	const POLL_INTERVAL = 30000;
	let intervalId = null;

	function formatTimeRemaining(currentTime, duration) {
		const remaining = duration - currentTime;
		if (remaining <= 0) return "0:00 left";

		const hours = Math.floor(remaining / 3600);
		const minutes = Math.floor((remaining % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m left`;
		}
		return `${minutes}m left`;
	}

	function updateAudiobookListening(data) {
		const container = document.getElementById("audiobook-listening");
		if (!container) return;

		if (!data || !data.isListening || !data.book) {
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

	async function fetchAudiobookListening() {
		try {
			const response = await fetch("/api/audiobookshelf/listening");
			if (!response.ok) return;

			const data = await response.json();
			if (data.error) return;

			updateAudiobookListening(data);
		} catch {
			return;
		}
	}

	function init() {
		if (intervalId) {
			clearInterval(intervalId);
		}

		fetchAudiobookListening();
		intervalId = setInterval(fetchAudiobookListening, POLL_INTERVAL);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
