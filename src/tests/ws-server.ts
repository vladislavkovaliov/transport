import { WebSocketServer } from "ws";

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`✅ WebSocket server started on ws://localhost:${PORT}`);

wss.on("connection", (ws) => {
    console.log("🔌 New client connected");

    ws.on("message", (message) => {
        console.log(`📩 Received: ${message}`);

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(`Echo: ${message}`);
            }
        });
    });

    ws.on("close", () => {
        console.log("❌ Client disconnected");
    });
});

setInterval(() => {
    const payload = JSON.stringify({
        type: "heartbeat",
        timestamp: Date.now(),
        data: Math.random(),
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}, 1000);
