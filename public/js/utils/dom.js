const ESCAPE_MAP = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

const ESCAPE_RE = /[&<>"']/g;
const escapeReplacer = (ch) => ESCAPE_MAP[ch];

export function escapeHtml(value) {
	if (value == null) return "";
	return String(value).replace(ESCAPE_RE, escapeReplacer);
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

function isValidCodePoint(code) {
	return Number.isFinite(code) && code >= 0 && code <= 0x10ffff;
}

const ENTITY_RE = /&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g;
const entityReplacer = (match, entity) => {
	if (entity.startsWith("#x") || entity.startsWith("#X")) {
		const code = Number.parseInt(entity.slice(2), 16);
		return isValidCodePoint(code) ? String.fromCodePoint(code) : match;
	}
	if (entity.startsWith("#")) {
		const code = Number.parseInt(entity.slice(1), 10);
		return isValidCodePoint(code) ? String.fromCodePoint(code) : match;
	}
	return NAMED_ENTITIES[entity] ?? match;
};

export function decodeEntities(text) {
	if (!text) return "";
	return text.replace(ENTITY_RE, entityReplacer);
}
