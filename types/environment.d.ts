type Environment = {
	port: number;
	host: string;
	development: boolean;
};

type Wakapi = {
	url: string | false;
	key: string | null;
};

type Audiobookshelf = {
	url: string | false;
	token: string | null;
};

type TimezoneDB = {
	url: string | false;
	id: string | null;
};
