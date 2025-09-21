type Environment = {
	port: number;
	host: string;
	development: boolean;
};


type Audiobookshelf = {
	url: string | false;
	token: string | null;
};

type TimezoneDB = {
	url: string | false;
	id: string | null;
};
