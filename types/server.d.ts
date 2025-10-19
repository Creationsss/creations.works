type QueryParams = Record<string, string>;
type Query = Record<string, string>;
type Params = Record<string, string>;

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

type WebSocketData = {
	routeModule?: RouteModule;
	params?: Params;
	query?: Query;
};

type Handler = (
	request: ExtendedRequest,
	server: Server<WebSocketData>,
) => Promise<Response> | Response;

type WebSocketHandler = {
	message?: (ws: ServerWebSocket<WebSocketData>, message: string) => void;
	open?: (ws: ServerWebSocket<WebSocketData>) => void;
	close?: (
		ws: ServerWebSocket<WebSocketData>,
		code: number,
		reason: string,
	) => void;
	drain?: (ws: ServerWebSocket<WebSocketData>) => void;
};

type RouteModule = {
	handler: Handler;
	routeDef: RouteDef;
	websocket?: WebSocketHandler;
};
