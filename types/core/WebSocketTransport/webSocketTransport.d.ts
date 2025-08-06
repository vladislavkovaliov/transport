import { BaseTransport } from "../BaseTransport";
export declare class WebSocketTransport extends BaseTransport {
    private ws;
    private url;
    constructor(url: string);
    connect(): void;
    disconnect(): void;
}
