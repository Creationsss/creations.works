(() => {
	const POLL_INTERVAL = 30000;
	let intervalId = null;

	function getServiceUrl(service, track, artist) {
		const query = encodeURIComponent(`${track} ${artist}`);
		switch (service) {
			case "lastfm":
				return `https://www.last.fm/music/${encodeURIComponent(artist)}/_/${encodeURIComponent(track)}`;
			case "tidal":
				return `https://tidal.com/search?q=${query}`;
			case "spotify":
				return `https://open.spotify.com/search/${query}`;
			default:
				return "";
		}
	}

	function updateNowPlaying(data) {
		const container = document.getElementById("now-playing");
		if (!container) return;

		if (!data || !data.isPlaying || !data.track) {
			container.classList.remove("visible");
			return;
		}

		const track = data.track;
		const cover = container.querySelector(".now-playing-cover");
		const trackName = container.querySelector(".now-playing-track");
		const artist = container.querySelector(".now-playing-artist");
		const links = container.querySelectorAll(".now-playing-link");

		trackName.textContent = track.name;
		artist.textContent = track.artist;

		cover.src = track.image || "/public/assets/default-album.svg";
		cover.alt = track.name;

		links.forEach((link) => {
			const service = link.dataset.service;
			link.href = getServiceUrl(service, track.name, track.artist);
		});

		container.classList.add("visible");
	}

	async function fetchNowPlaying() {
		try {
			const response = await fetch("/api/lastfm/nowplaying");
			if (!response.ok) return;

			const data = await response.json();
			if (data.error) return;

			updateNowPlaying(data);
		} catch {
			return;
		}
	}

	function init() {
		if (intervalId) {
			clearInterval(intervalId);
		}

		fetchNowPlaying();
		intervalId = setInterval(fetchNowPlaying, POLL_INTERVAL);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
