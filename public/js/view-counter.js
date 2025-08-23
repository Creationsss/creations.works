let viewsData = null;
let viewsError = null;
let analyticsData = null;

const currentPath = window.location.pathname;
const apiUrl = `/api/analytics?route=${encodeURIComponent(currentPath)}`;

fetch(apiUrl)
	.then((response) => {
		if (!response.ok) {
			throw new Error("Failed to fetch analytics data");
		}
		return response.json();
	})
	.then((data) => {
		if (data?.error) {
			viewsError = "Analytics data unavailable";
			return;
		}
		if (data?.views && data.views.length > 0) {
			viewsData = data.views[0];
			analyticsData = data;
		}
	})
	.catch(() => {
		viewsError = "Failed to load analytics data";
	});

function updateViewCounter() {
	const viewCounterContainer = document.getElementById(
		"view-counter-container",
	);

	if (viewsError || !viewCounterContainer) {
		if (viewCounterContainer) {
			viewCounterContainer.style.display = "none";
		}
		return;
	}

	if (viewsData) {
		const viewsCountElement = document.getElementById("views-count");
		const uniqueCountElement = document.getElementById("unique-count");

		if (viewsCountElement) {
			viewsCountElement.textContent = formatNumber(viewsData.views);
		}
		if (uniqueCountElement) {
			uniqueCountElement.textContent = formatNumber(viewsData.uniqueViews);
		}

		addHoverTooltip(viewCounterContainer);

		setTimeout(() => {
			viewCounterContainer.classList.add("loaded");
		}, 10);
		return;
	}

	setTimeout(updateViewCounter, 50);
}

function formatNumber(num) {
	if (num >= 1000000) {
		return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
	}
	if (num >= 1000) {
		return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
	}
	return num.toString();
}

const isBrowserLocale24h_ = () =>
	!new Intl.DateTimeFormat(navigator.language, { hour: "numeric" })
		.format(0)
		.match(/AM/);

const is24HourFormat_ = localStorage.getItem("timezone24HourFormat")
	? localStorage.getItem("timezone24HourFormat") === "true"
	: isBrowserLocale24h_();

function formatTime(timestamp) {
	const date = new Date(timestamp);

	if (is24HourFormat_) {
		return (
			date.toLocaleDateString(navigator.language) +
			" " +
			date.toLocaleTimeString(navigator.language, { hour12: false })
		);
	}
	return (
		date.toLocaleDateString(navigator.language) +
		" " +
		date.toLocaleTimeString(navigator.language, { hour12: true })
	);
}

function addHoverTooltip(container) {
	if (!analyticsData) return;

	let tooltip = null;

	container.addEventListener("mouseenter", () => {
		tooltip = document.createElement("div");
		tooltip.className = "view-counter-tooltip";
		tooltip.innerHTML = `
			<div>Cached: ${formatTime(analyticsData.lastUpdate)}</div>
			<div>Refreshes: ${formatTime(analyticsData.nextUpdate)}</div>
		`;
		document.body.appendChild(tooltip);

		const rect = container.getBoundingClientRect();
		tooltip.style.position = "fixed";
		tooltip.style.right = `${window.innerWidth - rect.left + 10}px`;
		tooltip.style.top = `${rect.top}px`;
		tooltip.style.zIndex = "1000";
	});

	container.addEventListener("mouseleave", () => {
		if (tooltip) {
			document.body.removeChild(tooltip);
			tooltip = null;
		}
	});
}

document.addEventListener("DOMContentLoaded", updateViewCounter);
