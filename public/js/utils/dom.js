const ESCAPE_MAP = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

export function escapeHtml(value) {
	if (value == null) return "";
	return String(value).replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

export function delegate(root, event, selector, handler) {
	root.addEventListener(event, (e) => {
		const match = e.target.closest(selector);
		if (match && root.contains(match)) handler(e, match);
	});
}

export function safeUrl(url) {
	try {
		const parsed = new URL(url);
		if (parsed.protocol === "http:" || parsed.protocol === "https:") {
			return parsed.href;
		}
	} catch {
		return null;
	}
	return null;
}

const NAMED_ENTITIES = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: "\u00a0",
	mdash: "\u2014",
	ndash: "\u2013",
	hellip: "\u2026",
	lsquo: "\u2018",
	rsquo: "\u2019",
	ldquo: "\u201c",
	rdquo: "\u201d",
};

export function decodeEntities(text) {
	if (!text) return "";
	return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
		if (entity.startsWith("#x") || entity.startsWith("#X")) {
			const code = Number.parseInt(entity.slice(2), 16);
			return Number.isFinite(code) ? String.fromCodePoint(code) : match;
		}
		if (entity.startsWith("#")) {
			const code = Number.parseInt(entity.slice(1), 10);
			return Number.isFinite(code) ? String.fromCodePoint(code) : match;
		}
		return NAMED_ENTITIES[entity] ?? match;
	});
}
