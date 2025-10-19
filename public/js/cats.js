import { UI } from "./utils/constants.js";

const catsTrigger = document.getElementById("cats-trigger");
const totalCats = UI.TOTAL_CATS;

function createFloatingCat(usedCats) {
	const availableCats = [];
	for (let i = 1; i <= totalCats; i++) {
		if (!usedCats.includes(i)) {
			availableCats.push(i);
		}
	}

	if (availableCats.length === 0) {
		for (let i = 1; i <= totalCats; i++) {
			availableCats.push(i);
		}
		usedCats.length = 0;
	}

	const catNumber =
		availableCats[Math.floor(Math.random() * availableCats.length)];
	usedCats.push(catNumber);

	const cat = document.createElement("img");
	cat.src = `/public/assets/cats/cat-${catNumber}.png`;
	cat.className = "floating-cat";

	cat.style.left = `${Math.random() * (window.innerWidth - UI.CAT_SPAWN_RANGE) + UI.CAT_SPAWN_OFFSET}px`;
	cat.style.top = `${Math.random() * (window.innerHeight - UI.CAT_SPAWN_RANGE) + UI.CAT_SPAWN_OFFSET}px`;

	const directions = [
		"float-up",
		"float-down",
		"float-left",
		"float-right",
		"float-diagonal",
	];
	cat.classList.add(directions[Math.floor(Math.random() * directions.length)]);

	document.body.appendChild(cat);

	setTimeout(() => {
		if (cat.parentNode) {
			cat.parentNode.removeChild(cat);
		}
	}, UI.CAT_LIFETIME);
}

catsTrigger.addEventListener("mouseenter", () => {
	const usedCats = [];
	const numberOfCats =
		Math.floor(Math.random() * (UI.CAT_COUNT_MAX - UI.CAT_COUNT_MIN + 1)) +
		UI.CAT_COUNT_MIN;
	for (let i = 0; i < numberOfCats; i++) {
		setTimeout(() => createFloatingCat(usedCats), i * UI.CAT_DELAY);
	}
});
