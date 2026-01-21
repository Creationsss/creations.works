(() => {
	const hour = new Date().getHours();
	const isDaytime = hour >= 7 && hour < 19;

	const theme = isDaytime ? "white" : "dark";
	const colorScheme = isDaytime ? "light" : "dark";

	document.documentElement.setAttribute("data-theme", theme);

	const meta = document.querySelector('meta[name="color-scheme"]');
	if (meta) {
		meta.setAttribute("content", colorScheme);
	}
})();
