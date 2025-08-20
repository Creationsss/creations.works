import { echo } from "@atums/echo";

import { verifyRequiredVariables } from "#environment";
import { serverHandler } from "#server";

async function main(): Promise<void> {
	verifyRequiredVariables();

	serverHandler.initialize();
}

main().catch((error: Error) => {
	echo.error({ message: "Error initializing the server:", error });
	process.exit(1);
});
