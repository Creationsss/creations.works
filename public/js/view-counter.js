let viewsData = null;
let viewsError = null;

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

document.addEventListener("DOMContentLoaded", updateViewCounter);
