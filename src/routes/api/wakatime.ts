import { environment, wakapi } from "#environment";
import { CACHE_DURATION } from "#environment/constants";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: "application/json",
};

let cachedData: object | null = null;
let cacheTimestamp = 0;

async function handler(): Promise<Response> {
	const now = Date.now();

	if (
		cachedData &&
		cacheTimestamp &&
		now - cacheTimestamp < CACHE_DURATION &&
		!environment.development
	) {
		return Response.json(cachedData);
	}

	if (!wakapi.url || !wakapi.key) {
		return Response.json(
			{ error: "Wakapi stats unavailable" },
			{ status: 503 },
		);
	}

	try {
		const baseUrl = wakapi.url.startsWith("http")
			? wakapi.url
			: `https://${wakapi.url}`;

		const apiKey = `?api_key=${wakapi.key}`;
		const userBase = "/api/v1/users/current";

		const endpoints = [
			`${baseUrl}${userBase}/stats/all_time${apiKey}`,
			`${baseUrl}${userBase}/stats/today${apiKey}`,
		];

		const responses = await Promise.allSettled(
			endpoints.map((url) => fetch(url)),
		);

		const [allTimeRes, todayRes] = responses;

		let allTimeData = null;
		let todayData = null;

		if (
			allTimeRes &&
			allTimeRes.status === "fulfilled" &&
			allTimeRes.value.ok
		) {
			allTimeData = (await allTimeRes.value.json()).data;
		}

		if (todayRes && todayRes.status === "fulfilled" && todayRes.value.ok) {
			todayData = (await todayRes.value.json()).data;
		}

		const todaySeconds = todayData?.total_seconds || 0;
		const todayHours = Math.floor(todaySeconds / 3600);
		const todayMinutes = Math.floor((todaySeconds % 3600) / 60);

		const getTopItems = (items: WakapiItem[] | undefined, limit = 5) => {
			return (
				items?.slice(0, limit).map((item: WakapiItem) => ({
					name: item.name,
					percent: Math.round(item.percent || 0),
					hours: Math.floor(item.total_seconds / 3600),
					minutes: Math.floor((item.total_seconds % 3600) / 60),
					totalSeconds: item.total_seconds,
				})) || []
			);
		};

		const getAverageDaily = (data: WakapiData | null) => {
			if (!data?.human_readable_daily_average) return "0h 0m";
			return data.human_readable_daily_average;
		};

		const formattedData = {
			allTime: {
				total: allTimeData?.human_readable_total || "0h 0m",
				average: getAverageDaily(allTimeData),
				languages: getTopItems(allTimeData?.languages),
				projects: getTopItems(allTimeData?.projects),
				editors: getTopItems(allTimeData?.editors),
				operatingSystems: getTopItems(allTimeData?.operating_systems),
			},
			today: {
				total:
					todayMinutes > 0
						? `${todayHours}h ${todayMinutes}m`
						: `${todayHours}h`,
				totalSeconds: todaySeconds,
				languages: getTopItems(todayData?.languages),
				projects: getTopItems(todayData?.projects),
				editors: getTopItems(todayData?.editors),
			},
		};

		cachedData = formattedData;
		cacheTimestamp = now;

		return Response.json(formattedData);
	} catch (error) {
		return Response.json(
			{
				error: "Failed to fetch Wakapi stats",
				details: (error as Error).message,
			},
			{ status: 500 },
		);
	}
}

export { handler, routeDef };
