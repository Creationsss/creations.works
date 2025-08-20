interface WakapiItem {
	name: string;
	percent?: number;
	total_seconds: number;
}

interface WakapiData {
	human_readable_total?: string;
	human_readable_daily_average?: string;
	total_seconds?: number;
	languages?: WakapiItem[];
	projects?: WakapiItem[];
	editors?: WakapiItem[];
	operating_systems?: WakapiItem[];
	machines?: WakapiItem[];
	best_day?: { hours?: { name: string }[] };
}

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

interface WakapiFormattedItem {
	name: string;
	percent: number;
	hours: number;
	minutes: number;
	totalSeconds: number;
}

interface WakapiFormattedData {
	allTime: {
		total: string;
		average: string;
		languages: WakapiFormattedItem[];
		projects: WakapiFormattedItem[];
		editors: WakapiFormattedItem[];
		operatingSystems: WakapiFormattedItem[];
	};
	today: {
		total: string;
		totalSeconds: number;
		languages: WakapiFormattedItem[];
		projects: WakapiFormattedItem[];
		editors: WakapiFormattedItem[];
	};
}
