import { verifyRequiredVariables } from "#environment";
import { serverHandler } from "#server";
import { startAniListCache } from "#services/anilist";
import { startAudiobookshelfListeningCache } from "#services/audiobookshelf-listening";
import { startBooksCache } from "#services/audiobookshelf-stats";
import { startLastFmCache } from "#services/lastfm";
import { startImageCaches } from "#services/profile-picture";
import { startProjectLinksCache } from "#services/project-links";
import { startSrsViewerCache } from "#services/srs-viewer";
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
	startSrsViewerCache();

	serverHandler.initialize();
}

main().catch((error: Error) => {
	process.stderr.write(`Error initializing the server: ${error}\n`);
	process.exit(1);
});
