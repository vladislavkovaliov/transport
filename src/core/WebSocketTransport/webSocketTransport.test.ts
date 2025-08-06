import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebSocketTransport } from "./webSocketTransport";
import { IMessage } from "../types";

// Мок WebSocket API
class MockWebSocket {
    public static OPEN = 1;
    public readyState = 0;
    public sent: string[] = [];

    private listeners: Record<string, Function[]> = {
        open: [],
        message: [],
        close: [],
    };

    constructor(public url: string) {}

    public send = (data: string) => {
        this.sent.push(data);
    };

    close() {
        this.readyState = 3;
        this.listeners.close.forEach((fn) => fn());
    }

    addEventListener(event: string, callback: Function) {
        this.listeners[event]?.push(callback);
    }

    simulateOpen() {
        this.readyState = MockWebSocket.OPEN;

        this.listeners.open.forEach((fn) => fn());
    }

    simulateMessage(data: any) {
        const event = { data: JSON.stringify(data) };
        this.listeners.message.forEach((fn) => fn(event));
    }

    simulateInvalidMessage() {
        const event = { data: "not-json" };
        this.listeners.message.forEach((fn) => fn(event));
    }

    simulateClose() {
        this.readyState = 3;
        this.listeners.close.forEach((fn) => fn());
    }
}

describe("WebSocketTransport", () => {
    let transport: WebSocketTransport;
    let mockSocket: MockWebSocket;

    let originalOpen = 1;

    beforeEach(() => {
        vi.stubGlobal(
            "WebSocket",
            vi.fn((url: string) => {
                mockSocket = new MockWebSocket(url);

                originalOpen = WebSocket.OPEN;

                return mockSocket;
            }),
        );

        transport = new WebSocketTransport("ws://test");
        transport.start();
    });

    afterEach(() => {
        vi.restoreAllMocks();

        Object.defineProperty(WebSocket, "OPEN", {
            value: originalOpen,
            configurable: true,
        });
    });

    it("should connect and send messages after open", async () => {
        transport.connect();

        Object.defineProperty(WebSocket, "OPEN", {
            value: 1,
            configurable: true,
        });

        mockSocket.simulateOpen();

        const message: IMessage = { type: "test", payload: { hello: "world" } };

        transport.send(message);

        expect(mockSocket.sent).toContainEqual(JSON.stringify(message));
    });

    it("should emit incoming messages", async () => {
        transport.connect();
        mockSocket.simulateOpen();

        const received = new Promise<IMessage>((resolve) => {
            transport.onMessage().subscribe(resolve);
        });

        const incoming: IMessage = { type: "incoming", payload: { ok: true } };
        mockSocket.simulateMessage(incoming);

        const result = await received;
        expect(result).toEqual(incoming);
    });

    it("should handle invalid JSON safely", () => {
        transport.connect();
        mockSocket.simulateOpen();

        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});
        mockSocket.simulateInvalidMessage();

        expect(errorSpy).toHaveBeenCalledWith(
            "Failed to parse message",
            expect.any(SyntaxError),
        );
    });

    it("should close WebSocket and call super.disconnect()", () => {
        transport.connect();
        mockSocket.simulateOpen();

        Object.defineProperty(WebSocket, "OPEN", {
            value: 1,
            configurable: true,
        });
        const disconnectSpy = vi.spyOn(transport, "disconnect");

        mockSocket.simulateClose();
        Object.defineProperty(WebSocket, "CLOSED", {
            value: 3,
            configurable: true,
        });
        expect(disconnectSpy).toHaveBeenCalled();
    });
});
