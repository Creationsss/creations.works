(() => {
	const STORAGE_KEY = "theme-override";
	const POSITION_KEY = "theme-toggle-position";
	const POSITIONS = ["bottom-right", "bottom-left", "top-left", "top-right"];

	const calculateSunTimes = (lat, date) => {
		const rad = Math.PI / 180;
		const dayOfYear = Math.floor(
			(date - new Date(date.getFullYear(), 0, 0)) / 86400000,
		);

		const decl = -23.45 * Math.cos(rad * (360 / 365) * (dayOfYear + 10));

		const hourAngle =
			Math.acos(
				Math.cos(rad * 90.833) / (Math.cos(rad * lat) * Math.cos(rad * decl)) -
					Math.tan(rad * lat) * Math.tan(rad * decl),
			) / rad;

		const sunrise = 12 - hourAngle / 15;
		const sunset = 12 + hourAngle / 15;

		return { sunrise, sunset };
	};

	const estimateLatitude = () => {
		const timezoneOffset = new Date().getTimezoneOffset() / 60;
		if (timezoneOffset >= -2 && timezoneOffset <= 3) return 50;
		if (timezoneOffset >= -10 && timezoneOffset <= -5) return 40;
		if (timezoneOffset >= 4 && timezoneOffset <= 8) return 35;
		return 45;
	};

	const getAutoTheme = () => {
		const now = new Date();
		const currentHour = now.getHours() + now.getMinutes() / 60;
		const lat = estimateLatitude();
		const { sunrise, sunset } = calculateSunTimes(lat, now);
		return currentHour >= sunrise && currentHour < sunset;
	};

	const applyTheme = (isDaytime) => {
		const theme = isDaytime ? "white" : "dark";
		const colorScheme = isDaytime ? "light" : "dark";
		const apiTheme = isDaytime ? "light" : "dark";

		document.documentElement.setAttribute("data-theme", theme);

		const meta = document.querySelector('meta[name="color-scheme"]');
		if (meta) {
			meta.setAttribute("content", colorScheme);
		}

		const updateImages = () => {
			const pfp = document.querySelector(".hero-pfp");
			if (pfp) {
				pfp.src = `/api/pfp?theme=${apiTheme}`;
			}
		};

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", updateImages);
		} else {
			updateImages();
		}

		updateToggleButton(isDaytime);
	};

	const updateToggleButton = (isDaytime) => {
		const btn = document.getElementById("theme-toggle");
		if (!btn) return;

		btn.setAttribute("data-theme", isDaytime ? "light" : "dark");
		btn.setAttribute("title", isDaytime ? "let me sleep..." : "rise and shine!");
	};

	const getCurrentTheme = () => {
		const override = localStorage.getItem(STORAGE_KEY);
		if (override === "light") return true;
		if (override === "dark") return false;
		return getAutoTheme();
	};

	const getPosition = () => {
		return localStorage.getItem(POSITION_KEY) || POSITIONS[0];
	};

	const cyclePosition = () => {
		const current = getPosition();
		const available = POSITIONS.filter((p) => p !== current);
		const newPosition = available[Math.floor(Math.random() * available.length)];
		localStorage.setItem(POSITION_KEY, newPosition);
		return newPosition;
	};

	const applyPosition = (btn, position) => {
		btn.setAttribute("data-position", position);
	};

	const toggleTheme = () => {
		const currentIsDaytime = getCurrentTheme();
		const newIsDaytime = !currentIsDaytime;

		localStorage.setItem(STORAGE_KEY, newIsDaytime ? "light" : "dark");
		applyTheme(newIsDaytime);

		const btn = document.getElementById("theme-toggle");
		if (btn) {
			const newPosition = cyclePosition();
			applyPosition(btn, newPosition);
		}
	};

	const createToggleButton = () => {
		const btn = document.createElement("button");
		btn.id = "theme-toggle";
		btn.className = "theme-toggle";
		btn.setAttribute("aria-label", "Toggle theme");
		btn.setAttribute("data-theme", getCurrentTheme() ? "light" : "dark");
		btn.setAttribute("data-position", getPosition());
		btn.innerHTML = `
			<svg class="theme-toggle-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
			<svg class="theme-toggle-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
		`;
		btn.addEventListener("click", toggleTheme);
		document.body.appendChild(btn);
	};

	applyTheme(getCurrentTheme());

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", createToggleButton);
	} else {
		createToggleButton();
	}

	window.toggleTheme = toggleTheme;
})();
