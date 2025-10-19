import { echo } from "@atums/echo";

import { verifyRequiredVariables } from "#environment";
import { serverHandler } from "#server";
import { startPfpCache } from "#services/profile-picture";
import { startProjectsCache } from "#services/gitlab-projects";
import { startBooksCache } from "#services/audiobookshelf-stats";
import { startTimezoneCache } from "#services/timezonedb";

async function main(): Promise<void> {
	verifyRequiredVariables();

	startPfpCache();
	startProjectsCache();
	startBooksCache();
	startTimezoneCache();

	serverHandler.initialize();
}

main().catch((error: Error) => {
	echo.error({ message: "Error initializing the server:", error });
	process.exit(1);
});
