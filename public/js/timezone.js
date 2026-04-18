import { UI } from "./utils/constants.js";
import { delegate, escapeHtml } from "./utils/dom.js";

const STORAGE_KEY = "timezone24HourFormat";
let timezoneData = null;
let is24HourFormat = loadFormatPreference();
let updateInterval = null;

function loadFormatPreference() {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored !== null) return stored === "true";
	return !new Intl.DateTimeFormat(navigator.language, { hour: "numeric" })
		.format(0)
		.match(/AM/);
}

function hideTimezoneSection() {
	const section = document.querySelector(".timezone-section");
	if (section) section.style.display = "none";
}

async function fetchTimezone() {
	try {
		const response = await fetch("/api/timezonedb");
		if (!response.ok) {
			if (response.status === 503) hideTimezoneSection();
			return null;
		}
		const data = await response.json();
		if (data?.error) {
			if (data.error === "TimezoneDB service unavailable") {
				hideTimezoneSection();
			}
			return null;
		}
		return data ?? null;
	} catch {
		return null;
	}
}

function renderTimezone(container, data) {
	container.replaceChildren();
	container.insertAdjacentHTML(
		"beforeend",
		`
		<div class="timezone-info skeleton-loading">
			<div class="timezone-location">
				<span class="timezone-label skeleton-text skeleton-text-sm"></span>
				<span class="timezone-value skeleton-text skeleton-text-md"></span>
			</div>
			<div class="timezone-time">
				<span class="timezone-label skeleton-text skeleton-text-sm"></span>
				<span class="timezone-value skeleton-text skeleton-text-lg"></span>
			</div>
		</div>
		<div class="timezone-info">
			<div class="timezone-location">
				<span class="timezone-label">timezone:</span>
				<span class="timezone-value">${escapeHtml(data.timezone)}</span>
			</div>
			<div class="timezone-time" data-action="toggle-time-format">
				<span class="timezone-label">current time:</span>
				<span class="timezone-value" id="current-time">--:--</span>
			</div>
		</div>
	`,
	);
}

function updateCurrentTime() {
	if (!timezoneData) return;

	const now = new Date();
	const timeString = is24HourFormat
		? now.toLocaleTimeString("en-GB", {
				timeZone: timezoneData.timezone,
				hour12: false,
				hour: "2-digit",
				minute: "2-digit",
			})
		: now.toLocaleTimeString("en-US", {
				timeZone: timezoneData.timezone,
				hour12: true,
				hour: "numeric",
				minute: "2-digit",
			});

	const timeElement = document.getElementById("current-time");
	if (timeElement) timeElement.textContent = timeString;
}

function startClock() {
	if (updateInterval) clearInterval(updateInterval);
	updateCurrentTime();
	updateInterval = setInterval(updateCurrentTime, UI.TIMEZONE_UPDATE_INTERVAL);
}

async function init() {
	const container = document.getElementById("timezone-info");
	if (!container) return;

	timezoneData = await fetchTimezone();
	if (!timezoneData) {
		hideTimezoneSection();
		return;
	}

	renderTimezone(container, timezoneData);
	requestAnimationFrame(() => container.classList.add("loaded"));
	startClock();
}

delegate(document, "click", "[data-action=toggle-time-format]", () => {
	is24HourFormat = !is24HourFormat;
	localStorage.setItem(STORAGE_KEY, is24HourFormat.toString());
	updateCurrentTime();
});

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
	init();
}
