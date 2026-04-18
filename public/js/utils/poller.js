export function createPoller({ url, update, interval = 30000, fetchOptions }) {
	let intervalId = null;

	async function tick() {
		try {
			const response = await fetch(url, fetchOptions);
			if (!response.ok) return;
			const data = await response.json();
			if (data.error) return;
			update(data);
		} catch {
			/* swallow — transient network errors */
		}
	}

	function start() {
		if (intervalId) clearInterval(intervalId);
		tick();
		intervalId = setInterval(tick, interval);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", start, { once: true });
	} else {
		start();
	}

	return {
		stop: () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
		},
	};
}
