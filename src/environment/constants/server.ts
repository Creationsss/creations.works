const reqLoggerIgnores = {
	ignoredStartsWith: [
		"/public",
		"/api/audiobookshelf/author-details",
		"/api/audiobookshelf/author-image",
	],
	ignoredPaths: ["/favicon.ico"],
};

export { reqLoggerIgnores };
