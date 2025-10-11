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
};

const timezoneDB: TimezoneDB = {
	url: process.env.TIMEZONEDB_URL || false,
	id: process.env.TIMEZONEDB_ID || null,
};

const gitlab: GitLab = {
	instanceUrl: process.env.GITLAB_INSTANCE_URL || false,
	token: process.env.GITLAB_TOKEN || null,
	namespaces: (() => {
		const namespaceIds = process.env.GITLAB_NAMESPACE_ID
			? process.env.GITLAB_NAMESPACE_ID.split(",").map((id) => id.trim())
			: [];
		const namespaceTypes = process.env.GITLAB_NAMESPACE_TYPE
			? process.env.GITLAB_NAMESPACE_TYPE.split(",").map((type) => type.trim())
			: [];

		if (namespaceIds.length === 0) {
			return [];
		}

		return namespaceIds.map((id, index) => ({
			id,
			type: (namespaceTypes[index] as "user" | "group") || "user",
		}));
	})(),
	ignoreNames: process.env.GITLAB_IGNORE_NAMES
		? process.env.GITLAB_IGNORE_NAMES.split(",").map((name) => name.trim())
		: [],
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
		if (gitlab.namespaces.length === 0) {
			echo.error(
				"GITLAB_NAMESPACE_ID is required when GITLAB_INSTANCE_URL is set",
			);
			hasError = true;
		}
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
	verifyRequiredVariables,
};
