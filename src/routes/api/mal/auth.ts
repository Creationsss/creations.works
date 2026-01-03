import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTENT_TYPE } from "#constants";
import { myAnimeList } from "#environment";

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.HTML,
};

const VERIFIER_FILE = resolve("data", "mal-verifier.json");
const TOKEN_FILE = resolve("data", "mal-tokens.json");

function generateCodeVerifier(): string {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < 64; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

function saveCodeVerifier(verifier: string): void {
	const dir = resolve("data");
	if (!existsSync(dir)) {
		mkdirSync(dir, { recursive: true });
	}
	writeFileSync(VERIFIER_FILE, JSON.stringify({ verifier }));
}

async function handler(request: Request): Promise<Response> {
	if (existsSync(TOKEN_FILE)) {
		return new Response("Already authenticated", { status: 403 });
	}

	if (!myAnimeList.clientId) {
		return new Response("MAL_CLIENT_ID not configured", { status: 500 });
	}

	const url = new URL(request.url);
	const forwardedProto = request.headers.get("x-forwarded-proto");
	const protocol = forwardedProto ? `${forwardedProto}:` : url.protocol;
	const redirectUri = `${protocol}//${url.host}/api/mal/callback`;

	const codeVerifier = generateCodeVerifier();
	saveCodeVerifier(codeVerifier);

	const authUrl = new URL("https://myanimelist.net/v1/oauth2/authorize");
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("client_id", myAnimeList.clientId);
	authUrl.searchParams.set("redirect_uri", redirectUri);
	authUrl.searchParams.set("code_challenge", codeVerifier);
	authUrl.searchParams.set("code_challenge_method", "plain");

	return Response.redirect(authUrl.toString(), 302);
}

export { handler, routeDef, VERIFIER_FILE };
