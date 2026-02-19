import { requiredVariables } from "#environment/constants";

const environment: Environment = {
	port: Number.parseInt(process.env.PORT || "8080", 10),
	host: process.env.HOST || "0.0.0.0",
	development:
		process.env.NODE_ENV === "development" || process.argv.includes("--dev"),
};

const audiobookshelf: Audiobookshelf = {
	url: process.env.AUDIOBOOKSHELF_URL || null,
	token: process.env.AUDIOBOOKSHELF_TOKEN || null,
	libraryIds: process.env.AUDIOBOOKSHELF_LIBRARY_IDS
		? process.env.AUDIOBOOKSHELF_LIBRARY_IDS.split(",").map((id) => id.trim())
		: [],
};

const timezoneDB: TimezoneDB = {
	url: process.env.TIMEZONEDB_URL || null,
	id: process.env.TIMEZONEDB_ID || null,
};

const gitlab: GitLab = {
	instanceUrl: process.env.GITLAB_INSTANCE_URL || null,
	token: process.env.GITLAB_TOKEN || null,
};

const siteImages: SiteImages = {
	profilePicture: {
		light: process.env.PROFILE_PICTURE_LIGHT || null,
		dark: process.env.PROFILE_PICTURE_DARK || null,
	},
	background: {
		light: process.env.BACKGROUND_IMAGE_LIGHT || null,
		dark: process.env.BACKGROUND_IMAGE_DARK || null,
	},
};

const projectLinks: ProjectLink[] = process.env.PROJECT_LINKS
	? process.env.PROJECT_LINKS.split(",")
			.map((url) => url.trim())
			.filter((url) => url.length > 0)
			.map((url) => ({ url }))
	: [];

const aniList: AniList = {
	username: process.env.ANILIST_USERNAME || null,
};

const lastFm: LastFm = {
	apiKey: process.env.LASTFM_API_KEY || null,
	username: process.env.LASTFM_USERNAME || null,
};

const srsViewer: SrsViewer = {
	url: process.env.SRS_VIEWER_URL || null,
	username: process.env.SRS_VIEWER_USERNAME || null,
};

const offen: Offen = {
	scriptUrl: process.env.OFFEN_SCRIPT_URL || null,
	accountId: process.env.OFFEN_ACCOUNT_ID || null,
};

const site: Site = {
	name: process.env.SITE_NAME || "creations.works",
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

	if (lastFm.apiKey) {
		joined.push("LASTFM_USERNAME");
	}

	if (srsViewer.url) {
		joined.push("SRS_VIEWER_USERNAME");
	}

	for (const key of joined) {
		const value = process.env[key];
		if (value === undefined || value.trim() === "") {
			process.stderr.write(`Missing or empty environment variable: ${key}\n`);
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
	siteImages,
	projectLinks,
	aniList,
	lastFm,
	srsViewer,
	offen,
	site,
	verifyRequiredVariables,
};
