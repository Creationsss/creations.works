type QueryParams = Record<string, string>;

interface ExtendedRequest extends Request {
	startPerf: number;
	query: Query;
	params: Params;
	requestBody: unknown;
}

type RouteDef = {
	method: string | string[] | "websocket";
	accepts: string | null | string[];
	returns: string;
	needsBody?:
		| "multipart"
		| "json"
		| "urlencoded"
		| "text"
		| "raw"
		| "buffer"
		| "blob";
};

type Handler = (
	request: ExtendedRequest,
	server: Server,
) => Promise<Response> | Response;

type WebSocketHandler = {
	message?: (ws: ServerWebSocket, message: string) => void;
	open?: (ws: ServerWebSocket) => void;
	close?: (ws: ServerWebSocket, code: number, reason: string) => void;
	drain?: (ws: ServerWebSocket) => void;
};

type RouteModule = {
	handler: Handler;
	routeDef: RouteDef;
	websocket?: WebSocketHandler;
};
