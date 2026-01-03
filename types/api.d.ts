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

interface MALAnimeListItem {
	node: {
		id: number;
		title: string;
		main_picture?: {
			medium: string;
			large: string;
		};
		status?: string;
		media_type?: string;
		num_episodes?: number;
		start_season?: {
			year: number;
			season: string;
		};
		mean?: number;
		synopsis?: string;
		genres?: Array<{
			id: number;
			name: string;
		}>;
	};
	list_status: {
		status: string;
		score: number;
		num_episodes_watched: number;
		is_rewatching: boolean;
		updated_at: string;
		start_date?: string;
		finish_date?: string;
	};
}

interface MALAnimeListResponse {
	data: MALAnimeListItem[];
	paging?: {
		next?: string;
	};
}

interface MALUserInfo {
	id: number;
	name: string;
	picture?: string;
	joined_at?: string;
	anime_statistics?: {
		num_items_watching: number;
		num_items_completed: number;
		num_items_on_hold: number;
		num_items_dropped: number;
		num_items_plan_to_watch: number;
		num_items: number;
		num_days_watched: number;
		num_days_watching: number;
		num_days_completed: number;
		num_days_on_hold: number;
		num_days_dropped: number;
		num_days: number;
		num_episodes: number;
		num_times_rewatched: number;
		mean_score: number;
	};
}

interface MALData {
	user: MALUserInfo | null;
	watching: MALAnimeListItem[];
	completed: MALAnimeListItem[];
	onHold: MALAnimeListItem[];
	dropped: MALAnimeListItem[];
	planToWatch: MALAnimeListItem[];
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
