import { echo } from "@atums/echo";
import { requiredVariables } from "#environment/constants";

const environment: Environment = {
	port: Number.parseInt(process.env.PORT || "8080", 10),
	host: process.env.HOST || "0.0.0.0",
	development:
		process.env.NODE_ENV === "development" || process.argv.includes("--dev"),
};

const audiobookshelf: Audiobookshelf = {
	url: process.env.AUDIOBOOKSHELF_URL || false,
	token: process.env.AUDIOBOOKSHELF_TOKEN || null,
	libraryIds: process.env.AUDIOBOOKSHELF_LIBRARY_IDS
		? process.env.AUDIOBOOKSHELF_LIBRARY_IDS.split(",").map((id) => id.trim())
		: [],
};

const timezoneDB: TimezoneDB = {
	url: process.env.TIMEZONEDB_URL || false,
	id: process.env.TIMEZONEDB_ID || null,
};

const gitlab: GitLab = {
	instanceUrl: process.env.GITLAB_INSTANCE_URL || false,
	token: process.env.GITLAB_TOKEN || null,
};

const gravatar: Gravatar = {
	email: process.env.GRAVATAR_EMAIL || null,
};

const projectLinks: ProjectLink[] = process.env.PROJECT_LINKS
	? process.env.PROJECT_LINKS.split(",")
			.map((url) => url.trim())
			.filter((url) => url.length > 0)
			.map((url) => ({ url }))
	: [];

const myAnimeList: MyAnimeList = {
	clientId: process.env.MAL_CLIENT_ID || null,
	clientSecret: process.env.MAL_CLIENT_SECRET || null,
	accessToken: process.env.MAL_ACCESS_TOKEN || null,
	refreshToken: process.env.MAL_REFRESH_TOKEN || null,
};

function verifyRequiredVariables(): void {
	let hasError = false;

	const joined = [...requiredVariables];

	if (audiobookshelf.url) {
		joined.push("AUDIOBOOKSHELF_TOKEN");
	}

	if (timezoneDB.url) {
		joined.push("TIMEZONEDB_ID");
	}

	if (gitlab.instanceUrl) {
		joined.push("GITLAB_TOKEN");
	}

	if (myAnimeList.clientId) {
		joined.push("MAL_CLIENT_SECRET");
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

export {
	environment,
	audiobookshelf,
	timezoneDB,
	gitlab,
	gravatar,
	projectLinks,
	myAnimeList,
	verifyRequiredVariables,
};
