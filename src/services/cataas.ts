import { echo } from "@atums/echo";
import { CachedService } from "./base-cache";

const CAT_COUNT = 10;
const CATAAS_URL = "https://cataas.com/cat?type=square";

class CataasService extends CachedService<ArrayBuffer[]> {
	protected getServiceName(): string {
		return "Cataas";
	}

	protected async fetchData(): Promise<ArrayBuffer[] | null> {
		const results: ArrayBuffer[] = [];

		const promises = Array.from({ length: CAT_COUNT }, async () => {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000);

				const response = await fetch(CATAAS_URL, {
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				if (!response.ok) return null;

				return await response.arrayBuffer();
			} catch (error) {
				echo.warn("Failed to fetch cat:", error);
				return null;
			}
		});

		const fetched = await Promise.all(promises);

		for (const buf of fetched) {
			if (buf) results.push(buf);
		}

		if (results.length === 0) return null;

		return results;
	}

	protected override logCacheSuccess(): void {
		const count = this.cache?.length ?? 0;
		echo.debug(`Cataas cached ${count} cats`);
	}
}

const cataasService = new CataasService();

export function getCachedCat(index?: number): ArrayBuffer | null {
	const cache = cataasService.getCache();
	if (!cache || cache.length === 0) return null;

	const i =
		index !== undefined && index >= 0 && index < cache.length
			? index
			: Math.floor(Math.random() * cache.length);

	return cache[i] ?? null;
}

export function getCachedCatCount(): number {
	return cataasService.getCache()?.length ?? 0;
}

export function startCataasCache(): void {
	cataasService.start();
}
