import { echo } from "@atums/echo";
import { requiredVariables } from "#environment/constants";

const environment: Environment = {
	port: Number.parseInt(process.env.PORT || "8080", 10),
	host: process.env.HOST || "0.0.0.0",
	development:
		process.env.NODE_ENV === "development" || process.argv.includes("--dev"),
};

const wakapi: Wakapi = {
	url: process.env.WAKAPI || false,
	key: process.env.WAKAPI_KEY || null,
	username: process.env.WAKAPI_USERNAME || null,
};

const audiobookshelf: Audiobookshelf = {
	url: process.env.AUDIOBOOKSHELF_URL || false,
	token: process.env.AUDIOBOOKSHELF_TOKEN || null,
};

function verifyRequiredVariables(): void {
	let hasError = false;

	const joined = [...requiredVariables];
	if (wakapi.url) {
		joined.push("WAKAPI_KEY");
		joined.push("WAKAPI_USERNAME");
	}
	if (audiobookshelf.url) {
		joined.push("AUDIOBOOKSHELF_TOKEN");
	}

	for (const key of joined) {
		const value = process.env[key];
		if (value === undefined || value.trim() === "") {
			echo.error(`Missing or empty environment variable: ${key}`);
			hasError = true;
		}
	}

	if (hasError) {
		process.exit(1);
	}
}

export { environment, wakapi, audiobookshelf, verifyRequiredVariables };
