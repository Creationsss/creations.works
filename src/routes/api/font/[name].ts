import { resolve } from "node:path";
import { CONTENT_TYPE } from "#constants";

const ALLOWED_FONTS: Record<string, string> = {
	medium: "BONX-Medium.otf",
	bold: "BONX-Bold.otf",
};

const routeDef: RouteDef = {
	method: "GET",
	accepts: "*/*",
	returns: CONTENT_TYPE.FONT_OTF,
};

async function handler(request: ExtendedRequest): Promise<Response> {
	const fontName = request.params.name;

	if (!fontName || !ALLOWED_FONTS[fontName]) {
		return new Response("Not Found", { status: 404 });
	}

	const referer = request.headers.get("Referer");
	const origin = request.headers.get("Origin");

	if (!referer && !origin) {
		return new Response("Forbidden", { status: 403 });
	}

	const fontPath = resolve("src", "fonts", ALLOWED_FONTS[fontName]);
	const file = Bun.file(fontPath);

	if (!(await file.exists())) {
		return new Response("Not Found", { status: 404 });
	}

	const buffer = await file.arrayBuffer();

	return new Response(buffer, {
		headers: {
			"Content-Type": CONTENT_TYPE.FONT_OTF,
			"Cross-Origin-Resource-Policy": "same-origin",
			"Cache-Control": "private, max-age=86400",
			"X-Content-Type-Options": "nosniff",
			"Content-Disposition": "inline",
		},
	});
}

export { handler, routeDef };
