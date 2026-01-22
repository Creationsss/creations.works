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

type MyAnimeList = {
	clientId: string | null;
	clientSecret: string | null;
	accessToken: string | null;
	refreshToken: string | null;
};

type AniList = {
	username: string | null;
};
