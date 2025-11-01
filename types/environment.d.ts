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
	namespaces: Array<{
		id: string;
		type: "user" | "group";
	}>;
	ignoreNames: string[];
	externalProjects: Array<{
		url: string;
		featured?: boolean;
	}>;
	featuredProjects: string[];
};

type Gravatar = {
	email: string | null;
};
