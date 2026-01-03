import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { echo } from "@atums/echo";
import { CONTENT_TYPE } from "#constants";
import { myAnimeList } from "#environment";
import { reloadMALTokens } from "#services/myanimelist";
import { VERIFIER_FILE } from "./auth";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.HTML,
};

const TOKEN_FILE = resolve("data", "mal-tokens.json");

function loadCodeVerifier(): string | null {
	try {
		if (existsSync(VERIFIER_FILE)) {
			const data = JSON.parse(readFileSync(VERIFIER_FILE, "utf-8"));
			return data.verifier;
		}
	} catch {
		return null;
	}
	return null;
}

async function handler(request: Request): Promise<Response> {
	if (existsSync(TOKEN_FILE)) {
		return new Response("Already authenticated", { status: 403 });
	}

	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const error = url.searchParams.get("error");

	if (error) {
		return new Response(
			`<html><body><h1>Authorization Failed</h1><p>${error}</p></body></html>`,
			{ status: 400, headers: { "Content-Type": "text/html" } },
		);
	}

	if (!code) {
		return new Response(
			"<html><body><h1>Missing authorization code</h1></body></html>",
			{ status: 400, headers: { "Content-Type": "text/html" } },
		);
	}

	if (!myAnimeList.clientId || !myAnimeList.clientSecret) {
		return new Response(
			"<html><body><h1>MAL credentials not configured</h1></body></html>",
			{ status: 500, headers: { "Content-Type": "text/html" } },
		);
	}

	const codeVerifier = loadCodeVerifier();
	if (!codeVerifier) {
		return new Response(
			"<html><body><h1>Code verifier not found</h1><p>Please start the auth flow again by visiting /api/mal/auth</p></body></html>",
			{ status: 400, headers: { "Content-Type": "text/html" } },
		);
	}

	const forwardedProto = request.headers.get("x-forwarded-proto");
	const protocol = forwardedProto ? `${forwardedProto}:` : url.protocol;
	const redirectUri = `${protocol}//${url.host}/api/mal/callback`;

	try {
		const response = await fetch("https://myanimelist.net/v1/oauth2/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: myAnimeList.clientId,
				client_secret: myAnimeList.clientSecret,
				grant_type: "authorization_code",
				code: code,
				code_verifier: codeVerifier,
				redirect_uri: redirectUri,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			echo.error(
				`MAL token exchange failed: ${response.status} - ${errorText}`,
			);
			return new Response(
				`<html><body><h1>Token Exchange Failed</h1><pre>${errorText}</pre></body></html>`,
				{ status: 400, headers: { "Content-Type": "text/html" } },
			);
		}

		const data = (await response.json()) as {
			access_token: string;
			refresh_token: string;
			expires_in: number;
		};

		const tokens = {
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			expiresAt: Date.now() + data.expires_in * 1000,
		};

		const dir = resolve("data");
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));

		reloadMALTokens();
		echo.info("MAL tokens saved and loaded successfully via OAuth callback");

		return new Response(
			`<html>
				<body style="font-family: system-ui; max-width: 600px; margin: 50px auto; text-align: center;">
					<h1>Authorization Successful</h1>
					<p>MyAnimeList tokens have been saved and loaded. You can close this page.</p>
				</body>
			</html>`,
			{ status: 200, headers: { "Content-Type": "text/html" } },
		);
	} catch (err) {
		echo.error("MAL callback error:", err);
		return new Response(
			`<html><body><h1>Error</h1><pre>${err}</pre></body></html>`,
			{ status: 500, headers: { "Content-Type": "text/html" } },
		);
	}
}

export { handler, routeDef };
