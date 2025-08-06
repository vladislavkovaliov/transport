import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseTransport } from "./baseTrabsport";
import { Middleware } from "../types";

class TestTransport extends BaseTransport {}

describe("BaseTransport with middleware and lifecycle", () => {
    let transport: TestTransport;
    let sendMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        transport = new TestTransport();
        sendMock = vi.fn();
    });

    it("applies middleware on send and receive", () => {
        const log: string[] = [];

        const logger: Middleware = (msg, dir) => {
            log.push(`${dir}:${msg.type}`);
            return msg;
        };

        transport.use(logger);
        transport.start();
        transport.connect(sendMock);

        transport.send({ type: "ping", payload: {} });
        transport.receive({ type: "pong", payload: {} });

        expect(log).toEqual(["out:ping", "in:pong"]);
    });

    it("filters onType even when paused", () =>
        new Promise<void>((done) => {
            transport.start();
            transport.pause();

            transport.onType("event").subscribe((msg) => {
                expect(msg.payload.value).toBe(42);
                done();
            });

            transport.receive({ type: "event", payload: { value: 42 } });
        }));

    it("filters onTypes after resume", () =>
        new Promise<void>((done) => {
            transport.start();
            transport.pause();

            const results: string[] = [];

            transport.onTypes(["a", "b"]).subscribe((msg) => {
                results.push(msg.type);
                if (results.length === 2) {
                    expect(results).toEqual(["a", "b"]);
                    done();
                }
            });

            transport.receive({ type: "a", payload: {} });
            transport.receive({ type: "b", payload: {} });

            transport.resume(); // onIIMessage still works regardless
        }));

    it("uses JSON serializer middleware correctly", () => {
        const serializer: Middleware = (msg, dir) => {
            if (dir === "out") {
                return { type: msg.type, payload: JSON.stringify(msg.payload) };
            } else {
                return { type: msg.type, payload: JSON.parse(msg.payload) };
            }
        };

        transport.use(serializer);
        transport.start();
        transport.connect(sendMock);

        transport.send({ type: "msg", payload: { hello: "world" } });
        expect(sendMock).toHaveBeenCalledWith({
            type: "msg",
            payload: '{"hello":"world"}',
        });

        const onReceive = vi.fn();
        transport.onType("msg").subscribe(onReceive);

        transport.receive({
            type: "msg",
            payload: '{"hello":"again"}',
        });

        expect(onReceive).toHaveBeenCalledWith({
            type: "msg",
            payload: { hello: "again" },
        });
    });

    it("handles high volume of messages and profiles memory/performance", async () => {
        const messageCount = 10_000;
        const received: any[] = [];

        // Memory snapshot before
        const memBefore = process.memoryUsage();
        console.time("load-test");

        transport.start();
        transport.connect(sendMock);

        transport.onType("bulk").subscribe((msg) => {
            received.push(msg);
        });

        for (let i = 0; i < messageCount; i++) {
            const message = { type: "bulk", payload: { index: i } };
            transport.send(message); // simulate outgoing
            transport.receive(message); // simulate incoming
        }

        await new Promise((res) => setTimeout(res, 50)); // allow events to flush

        console.timeEnd("load-test");
        const memAfter = process.memoryUsage();

        console.log("\n🧠 Memory usage diff:");
        for (const key in memAfter) {
            const before = memBefore[key];
            const after = memAfter[key];
            const diffMB = ((after - before) / 1024 / 1024).toFixed(2);
            console.log(`${key}: +${diffMB} MB`);
        }

        expect(received.length).toBe(messageCount);
        expect(sendMock).toHaveBeenCalledTimes(messageCount);
    });
});
