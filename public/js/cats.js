const catsTrigger = document.getElementById("cats-trigger");
const totalCats = 10;

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

	cat.style.left = `${Math.random() * (window.innerWidth - 200) + 100}px`;
	cat.style.top = `${Math.random() * (window.innerHeight - 200) + 100}px`;

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
	}, 3000);
}

catsTrigger.addEventListener("mouseenter", () => {
	const usedCats = [];
	const numberOfCats = Math.floor(Math.random() * 3) + 3;
	for (let i = 0; i < numberOfCats; i++) {
		setTimeout(() => createFloatingCat(usedCats), i * 400);
	}
});
