(() => {
	const backButton = document.querySelector(".back-button");
	if (!backButton) return;

	const backToHome = backButton.closest(".back-to-home");
	if (!backToHome) return;

	let initialOffset = 0;
	let initialTop = 0;
	let initialLeft = 0;
	let isSticky = false;

	function measure() {
		isSticky = false;
		backButton.classList.remove("sticky");
		backButton.style.top = "";
		backButton.style.left = "";

		initialOffset = backToHome.offsetTop;
		const rect = backButton.getBoundingClientRect();
		initialTop = rect.top + window.pageYOffset;
		initialLeft = rect.left;
	}

	function handleScroll() {
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

		if (scrollTop > initialOffset && !isSticky) {
			isSticky = true;
			const fixedTop = initialTop - initialOffset;
			backButton.classList.add("sticky");
			backButton.style.top = `${fixedTop}px`;
			backButton.style.left = `${initialLeft}px`;
		} else if (scrollTop <= initialOffset && isSticky) {
			isSticky = false;
			backButton.classList.remove("sticky");
			backButton.style.top = "";
			backButton.style.left = "";
		}
	}

	measure();
	handleScroll();

	window.addEventListener("scroll", handleScroll, { passive: true });
	window.addEventListener("resize", () => {
		measure();
		handleScroll();
	});
})();
