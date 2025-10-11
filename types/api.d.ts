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

interface GitLabProject {
	id: number;
	name: string;
	description: string | null;
	web_url: string;
	topics: string[];
	created_at: string;
	last_activity_at: string;
	default_branch: string;
	star_count: number;
	forks_count: number;
	open_issues_count: number;
	detectedLanguages?: string[];
}

interface ProjectResponse {
	name: string;
	description: string;
	sourceUrl: string;
	technologies: string[];
	links: Array<{ text: string; url: string }>;
	stats: {
		stars: number;
		forks: number;
		issues: number;
	};
}
