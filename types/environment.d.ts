type Environment = {
	port: number;
	host: string;
	development: boolean;
};

type Audiobookshelf = {
	url: string | false;
	token: string | null;
	libraryIds: string[];
};

type TimezoneDB = {
	url: string | false;
	id: string | null;
};

type GitLab = {
	instanceUrl: string | false;
	token: string | null;
};

type SiteImages = {
	profilePicture: {
		light: string | null;
		dark: string | null;
	};
	background: {
		light: string | null;
		dark: string | null;
	};
};

type ProjectLink = {
	url: string;
};

type AniList = {
	username: string | null;
};

type LastFm = {
	apiKey: string | null;
	username: string | null;
};
