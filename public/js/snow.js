import { UI } from "./utils/constants.js";

const snowContainer = document.createElement("div");
snowContainer.style.position = "fixed";
snowContainer.style.top = "0";
snowContainer.style.left = "0";
snowContainer.style.width = "100vw";
snowContainer.style.height = "100vh";
snowContainer.style.pointerEvents = "none";
document.body.appendChild(snowContainer);

const maxSnowflakes = UI.MAX_SNOWFLAKES;
const snowflakes = [];
const mouse = { x: -100, y: -100 };

document.addEventListener("mousemove", (e) => {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
});

const createSnowflake = () => {
	if (snowflakes.length >= maxSnowflakes) {
		const oldestSnowflake = snowflakes.shift();
		snowContainer.removeChild(oldestSnowflake);
	}

	const snowflake = document.createElement("div");
	snowflake.classList.add("snowflake");
	snowflake.style.position = "absolute";
	const size =
		Math.random() * (UI.SNOWFLAKE_SIZE_MAX - UI.SNOWFLAKE_SIZE_MIN) +
		UI.SNOWFLAKE_SIZE_MIN;
	snowflake.style.width = `${size}px`;
	snowflake.style.height = `${size}px`;
	snowflake.style.background = "var(--snowflake-color)";
	snowflake.style.borderRadius = "50%";
	snowflake.style.opacity = Math.random();

	snowflake.x = Math.random() * window.innerWidth;
	snowflake.y = -size;
	snowflake.speed =
		Math.random() * (UI.SNOWFLAKE_SPEED_MAX - UI.SNOWFLAKE_SPEED_MIN) +
		UI.SNOWFLAKE_SPEED_MIN;
	snowflake.directionX = (Math.random() - 0.5) * 0.5;
	snowflake.directionY = Math.random() * 0.5 + 0.5;

	snowflake.style.left = `${snowflake.x}px`;
	snowflake.style.top = `${snowflake.y}px`;

	snowflakes.push(snowflake);
	snowContainer.appendChild(snowflake);
};

setInterval(createSnowflake, UI.SNOWFLAKE_CREATION_INTERVAL);

function updateSnowflakes() {
	snowflakes.forEach((snowflake, index) => {
		const size = Number.parseFloat(snowflake.style.width);
		const centerX = snowflake.x + size / 2;
		const centerY = snowflake.y + size / 2;

		const dx = centerX - mouse.x;
		const dy = centerY - mouse.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < UI.SNOWFLAKE_REPEL_DISTANCE) {
			snowflake.directionX += (dx / distance) * 0.02;
			snowflake.directionY += (dy / distance) * 0.02;
		} else {
			snowflake.directionX += (Math.random() - 0.5) * 0.01;
			snowflake.directionY += (Math.random() - 0.5) * 0.01;
		}

		snowflake.x += snowflake.directionX * snowflake.speed;
		snowflake.y += snowflake.directionY * snowflake.speed;

		snowflake.style.left = `${snowflake.x}px`;
		snowflake.style.top = `${snowflake.y}px`;

		if (snowflake.y > window.innerHeight) {
			snowContainer.removeChild(snowflake);
			snowflakes.splice(index, 1);
			return;
		}

		if (
			snowflake.x > window.innerWidth ||
			snowflake.y > window.innerHeight ||
			snowflake.x < 0
		) {
			snowflake.x = Math.random() * window.innerWidth;
			snowflake.y = -size;
			snowflake.style.left = `${snowflake.x}px`;
			snowflake.style.top = `${snowflake.y}px`;
		}
	});

	requestAnimationFrame(updateSnowflakes);
}

updateSnowflakes();
