import { BaseTransport } from "../BaseTransport";
import { IMessage } from "../types";

export class WebSocketTransport extends BaseTransport {
    private ws: WebSocket | null = null;
    private url: string;

    constructor(url: string) {
        super();

        this.url = url;
    }

    override connect(): void {
        this.ws = new WebSocket(this.url);

        this.ws.addEventListener("open", () => {
            super.connect((msg: IMessage) => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify(msg));
                }
            });
        });

        this.ws.addEventListener("message", (event) => {
            try {
                const parsed = JSON.parse(event.data);

                this.receive(parsed);
            } catch (e) {
                console.error("Failed to parse message", e);
                this.receive({
                    type: "error",
                    payload: {
                        message: "Failed to parse message",
                    },
                });
            }
        });

        this.ws.addEventListener("close", () => {
            this.disconnect();
        });
    }

    disconnect(): void {
        super.disconnect();

        this.ws = null;
    }
}
