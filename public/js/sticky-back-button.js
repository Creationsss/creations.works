const backButton = document.querySelector(".back-button");

if (backButton) {
	const backToHome = backButton.closest(".back-to-home");
	const initialOffset = backToHome.offsetTop;
	let isSticky = false;

	const rect = backButton.getBoundingClientRect();
	const initialTop = rect.top + window.pageYOffset;
	const initialLeft = rect.left;

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

	window.addEventListener("scroll", handleScroll);
	handleScroll();
}
