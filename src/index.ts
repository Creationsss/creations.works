import { echo } from "@atums/echo";

import { verifyRequiredVariables } from "#environment";
import { serverHandler } from "#server";
import { startAniListCache } from "#services/anilist";
import { startAudiobookshelfListeningCache } from "#services/audiobookshelf-listening";
import { startBooksCache } from "#services/audiobookshelf-stats";
import { startLastFmCache } from "#services/lastfm";
import { startImageCaches } from "#services/profile-picture";
import { startProjectLinksCache } from "#services/project-links";
import { startTimezoneCache } from "#services/timezonedb";

async function main(): Promise<void> {
	verifyRequiredVariables();

	startImageCaches();
	startProjectLinksCache();
	startBooksCache();
	startAudiobookshelfListeningCache();
	startAniListCache();
	startTimezoneCache();
	startLastFmCache();

	serverHandler.initialize();
}

main().catch((error: Error) => {
	echo.error({ message: "Error initializing the server:", error });
	process.exit(1);
});
