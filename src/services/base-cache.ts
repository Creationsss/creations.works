import { echo } from "@atums/echo";
import { CACHE } from "#constants";

export abstract class CachedService<T> {
	protected cache: T | null = null;
	protected intervalId?: NodeJS.Timeout;

	protected abstract fetchData(): Promise<T | null>;

	protected abstract getServiceName(): string;

	private async updateCache(): Promise<void> {
		try {
			echo.debug(`Fetching ${this.getServiceName()}...`);
			const data = await this.fetchData();

			if (data !== null) {
				this.cache = data;
				this.logCacheSuccess();
			}
		} catch (error) {
			echo.error(`Failed to fetch ${this.getServiceName()}:`, error);
		}
	}

	protected logCacheSuccess(): void {
		echo.debug(`${this.getServiceName()} cached successfully`);
	}

	public getCache(): T | null {
		return this.cache;
	}

	public start(): void {
		this.updateCache();
		this.intervalId = setInterval(() => this.updateCache(), CACHE.INTERVAL);
	}

	public stop(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			delete this.intervalId;
		}
	}
}
