interface Library {
	id: string;
	name: string;
	mediaType: string;
}

interface LibrariesResponse {
	libraries: Library[];
}

interface LibraryDetail {
	id: string;
	name: string;
	total: number;
}

interface AudiobookshelfUser {
	username?: string;
	isActive?: boolean;
	lastSeen?: string;
	createdAt?: string;
}

interface AudiobookshelfStats {
	totalTime: number;
	totalItems: number;
	totalBooks: number;
	libraries: LibraryDetail[];
	items: Record<string, unknown>;
	today: number;
	recentSessions: unknown[];
	mediaProgress: unknown[];
	user: AudiobookshelfUser;
}

interface BooksData {
	totalTime: number;
	totalItems: number;
	totalBooks: number;
	libraries: unknown[];
	items: Record<string, unknown>;
	[key: string]: unknown;
}

interface TimezoneData {
	timezone: string;
	[key: string]: unknown;
}

interface LogEntry {
	timestamp: number;
	level: string;
	id: string;
	file: string;
	line: string;
	column: string;
	data: {
		context: string;
		data: [string, string, string];
	};
}

interface ViewsData {
	page: string;
	views: number;
	uniqueViews?: number;
}

interface ProjectInfo {
	name: string;
	description: string;
	url: string;
}

interface ProjectLinksData {
	projects: ProjectInfo[];
}

interface AniListDate {
	year: number | null;
	month: number | null;
	day: number | null;
}

interface AniListMedia {
	id: number;
	title: {
		romaji: string;
		english: string | null;
		native: string | null;
	};
	coverImage: {
		extraLarge: string;
		large: string;
		medium: string;
	};
	bannerImage: string | null;
	format: string;
	status: string;
	source: string | null;
	episodes: number | null;
	duration: number | null;
	season: string | null;
	seasonYear: number | null;
	averageScore: number | null;
	meanScore: number | null;
	genres: string[];
	description: string | null;
	studios: {
		nodes: Array<{ name: string }>;
	} | null;
	startDate: AniListDate | null;
	endDate: AniListDate | null;
	nextAiringEpisode: {
		airingAt: number;
		timeUntilAiring: number;
		episode: number;
	} | null;
	trailer: {
		id: string;
		site: string;
	} | null;
}

interface AniListEntry {
	id: number;
	mediaId: number;
	status: string;
	score: number;
	progress: number;
	startedAt: AniListDate;
	completedAt: AniListDate;
	updatedAt: number;
	media: AniListMedia;
}

interface AniListCharacter {
	id: number;
	name: {
		full: string;
		native: string | null;
		alternative: string[];
		alternativeSpoiler: string[];
	};
	image: {
		large: string;
		medium: string;
	};
	description: string | null;
	gender: string | null;
	age: string | null;
	dateOfBirth: AniListDate | null;
	bloodType: string | null;
	siteUrl: string;
}

interface AniListUser {
	id: number;
	name: string;
	avatar: {
		large: string;
		medium: string;
	};
	createdAt: number;
	statistics: {
		anime: {
			count: number;
			meanScore: number;
			standardDeviation: number;
			minutesWatched: number;
			episodesWatched: number;
			statuses: Array<{
				status: string;
				count: number;
			}>;
		};
	};
	favourites?: {
		characters?: {
			nodes: AniListCharacter[];
		};
	};
}

interface AniListData {
	user: AniListUser | null;
	watching: AniListEntry[];
	completed: AniListEntry[];
	onHold: AniListEntry[];
	dropped: AniListEntry[];
	planToWatch: AniListEntry[];
	favouriteCharacters: AniListCharacter[];
	statistics: {
		totalAnime: number;
		totalEpisodes: number;
		daysWatched: number;
		meanScore: number;
		watching: number;
		completed: number;
		onHold: number;
		dropped: number;
		planToWatch: number;
	};
}

interface NowPlayingTrack {
	name: string;
	artist: string;
	album: string | null;
	image: string | null;
	url: string;
}

interface NowPlayingData {
	isPlaying: boolean;
	track: NowPlayingTrack | null;
}

interface LastFmImage {
	"#text": string;
	size: string;
}

interface LastFmTrack {
	name: string;
	artist: {
		"#text": string;
		mbid?: string;
	};
	album?: {
		"#text": string;
		mbid?: string;
	};
	image?: LastFmImage[];
	url: string;
	"@attr"?: {
		nowplaying: string;
	};
}

interface LastFmResponse {
	recenttracks?: {
		track: LastFmTrack[];
	};
}
