export function normalizeUrl(url: string): string {
	if (url.startsWith("http://") || url.startsWith("https://")) {
		return url;
	}
	return `https://${url}`;
}

export function removeTrailingSlash(url: string): string {
	return url.replace(/\/$/, "");
}
