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

type Gravatar = {
	email: string | null;
};

type ProjectLink = {
	url: string;
};
