(() => {
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

	const applyTheme = (isDaytime) => {
		const theme = isDaytime ? "white" : "dark";
		const colorScheme = isDaytime ? "light" : "dark";

		document.documentElement.setAttribute("data-theme", theme);

		const meta = document.querySelector('meta[name="color-scheme"]');
		if (meta) {
			meta.setAttribute("content", colorScheme);
		}
	};

	const now = new Date();
	const currentHour = now.getHours() + now.getMinutes() / 60;
	const lat = estimateLatitude();
	const { sunrise, sunset } = calculateSunTimes(lat, now);

	const isDaytime = currentHour >= sunrise && currentHour < sunset;
	applyTheme(isDaytime);
})();
