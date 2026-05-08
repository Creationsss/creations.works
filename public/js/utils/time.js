export function formatDuration(seconds) {
	if (!Number.isFinite(seconds) || seconds <= 0) return "0m";
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours === 0) return `${minutes}m`;
	return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatTimeRemaining(currentTime, duration) {
	if (
		!Number.isFinite(currentTime) ||
		!Number.isFinite(duration) ||
		duration <= 0
	) {
		return "-- left";
	}
	const remaining = duration - currentTime;
	if (remaining <= 0) return "0m left";

	const hours = Math.floor(remaining / 3600);
	const minutes = Math.floor((remaining % 3600) / 60);

	if (hours > 0) return `${hours}h ${minutes}m left`;
	return `${minutes}m left`;
}

export function formatTimeUntil(seconds) {
	if (!Number.isFinite(seconds) || seconds <= 0) return "0m";
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	if (days > 0) return `${days}d ${hours}h`;
	const mins = Math.floor((seconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${mins}m`;
	return `${mins}m`;
}

export function formatRelativeTime(timestampSeconds) {
	if (!Number.isFinite(timestampSeconds)) return "unknown";
	const diff = Date.now() - timestampSeconds * 1000;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return new Date(timestampSeconds * 1000).toLocaleDateString();
}
