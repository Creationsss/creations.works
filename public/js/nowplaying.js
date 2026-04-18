import { createPoller } from "./utils/poller.js";

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

	if (!data?.isPlaying || !data.track) {
		container.classList.remove("visible");
		return;
	}

	const track = data.track;
	const cover = container.querySelector(".now-playing-cover");
	const trackName = container.querySelector(".now-playing-track");
	const artist = container.querySelector(".now-playing-artist");
	const links = container.querySelectorAll(".now-playing-link");

	if (trackName) trackName.textContent = track.name;
	if (artist) artist.textContent = track.artist;

	if (cover) {
		cover.src = track.image || "/public/assets/default-album.svg";
		cover.alt = track.name;
	}

	for (const link of links) {
		const service = link.dataset.service;
		link.href = getServiceUrl(service, track.name, track.artist);
	}

	container.classList.add("visible");
}

createPoller({
	url: "/api/lastfm/nowplaying",
	update: updateNowPlaying,
});
