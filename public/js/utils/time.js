import { TIME } from "./constants.js";

export function formatTimeFromSeconds(seconds) {
	const hours = Math.floor(seconds / TIME.SECONDS_PER_HOUR);
	const minutes = Math.floor((seconds % TIME.SECONDS_PER_HOUR) / 60);
	return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatDuration(seconds) {
	const days = Math.floor(seconds / TIME.SECONDS_PER_DAY);
	const hours = Math.floor(
		(seconds % TIME.SECONDS_PER_DAY) / TIME.SECONDS_PER_HOUR,
	);
	const minutes = Math.floor((seconds % TIME.SECONDS_PER_HOUR) / 60);

	const parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);

	return parts.join(" ") || "0m";
}

export function getDaysFromMilliseconds(ms) {
	return Math.floor(ms / TIME.MS_PER_DAY);
}

export function getYearsFromMilliseconds(ms) {
	return ms / TIME.MS_PER_YEAR;
}
