import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseTransport } from "../BaseTransport";
import { jsonSerializer } from "../middlewares/jsonSerializer";
import { IMessage } from "../types";

class TestTransport extends BaseTransport {
    public triggerReceive(msg: IMessage) {
        this.receive(msg);
    }
}

describe("BaseTransport with middleware", () => {
    let transport: TestTransport;
    let sendFn: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        transport = new TestTransport();
        sendFn = vi.fn();
        transport.use(jsonSerializer());
        transport.connect(sendFn);
        transport.start();
    });

    it("should serialize payload on send (outgoing)", () => {
        const message = {
            type: "test",
            payload: { hello: "world" },
        };

        transport.send(message);

        expect(sendFn).toHaveBeenCalledWith({
            type: "test",
            payload: JSON.stringify({ hello: "world" }),
        });
    });

    it("should deserialize payload on receive (incoming)", () =>
        new Promise<void>((done) => {
            const incoming = {
                type: "incoming",
                payload: JSON.stringify({ foo: 42 }),
            };

            transport.onMessage().subscribe((msg) => {
                expect(msg).toEqual({
                    type: "incoming",
                    payload: { foo: 42 },
                });
                done();
            });

            transport.triggerReceive(incoming);
        }));

    it("should drop incoming message if JSON.parse fails", () => {
        const spy = vi.fn();
        transport.onMessage().subscribe(spy);

        transport.triggerReceive({
            type: "bad-json",
            payload: "{invalid", // malformed JSON
        });

        expect(spy).not.toHaveBeenCalled();
    });

    it("should enqueue outgoing message if not connected", () => {
        transport.pause();

        transport.send({ type: "pause-test", payload: { a: 1 } });

        // shouldn't call immediately
        expect(sendFn).not.toHaveBeenCalled();

        // resume to flush queue
        transport.resume();

        expect(sendFn).toHaveBeenCalledWith({
            type: "pause-test",
            payload: JSON.stringify({ a: 1 }),
        });
    });
});
