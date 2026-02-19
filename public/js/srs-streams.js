(() => {
	const POLL_INTERVAL = 30000;
	let intervalId = null;

	function updateStreaming(data) {
		const container = document.getElementById("srs-streaming");
		if (!container) return;

		if (!data || !data.isLive || !data.streams || data.streams.length === 0) {
			container.classList.remove("visible");
			return;
		}

		const stream = data.streams[0];
		const preview = container.querySelector(".srs-streaming-preview");
		const name = container.querySelector(".srs-streaming-name");
		const viewers = container.querySelector(".srs-streaming-viewers");

		if (preview) {
			preview.classList.remove("loaded");
			preview.onload = () => preview.classList.add("loaded");
			preview.src = stream.previewUrl;
			preview.alt = stream.name;
		}

		if (name) name.textContent = stream.name;

		if (viewers) {
			viewers.textContent =
				stream.viewers === 1 ? "1 viewer" : `${stream.viewers} viewers`;
		}

		container.href = stream.watchUrl;
		container.classList.add("visible");
	}

	async function fetchStreams() {
		try {
			const response = await fetch("/api/srs/streams", { cache: "no-store" });
			if (!response.ok) return;

			const data = await response.json();
			if (data.error) return;

			updateStreaming(data);
		} catch {
			return;
		}
	}

	function init() {
		if (intervalId) {
			clearInterval(intervalId);
		}

		fetchStreams();
		intervalId = setInterval(fetchStreams, POLL_INTERVAL);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
