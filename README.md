# 🛰️ Reactive Transport Layer (with Middleware & WebSocket support)

This project provides an extensible transport layer built with **TypeScript**, featuring:

- 📦 Message-based communication
- 🔌 Adapter architecture (`BaseTransport`, `WebSocketTransport`)
- 🔁 Middleware system for serialization, logging, etc.
- ⚡ RxJS observables (`onType`, `onTypes`)
- 🧪 Full test coverage with **Vitest**
- 🧠 Performance/load test with memory usage snapshot

---

## 📦 Installation

```bash
npm install
```

## 🚀 Getting Started

```typescript
const transport = new WebSocketTransport('wss://yourserver.example');

transport.start(); // Starts lifecycle
transport.connect(); // Establish connection
```

## ✉️ Sending & Receiving Messages

### Send

```typescript
transport.send({ type: 'ping', payload: { id: 123 } });
```

### Listen for Messages

```typescript
transport.onType('pong').subscribe(msg => {
  console.log('Got pong!', msg.payload);
});
```

### 📬 `onMessage` — Receive All Incoming Messages

The `onMessage()` method is an RxJS observable that emits **every incoming message**, regardless of its `type`.

This is useful when:

- You want to monitor all message traffic
- You’re implementing custom routing
- You need to log or debug everything coming in

```ts
transport.onMessage().subscribe((message) => {
  console.log('Received message:', message);
});
```

### onType

```typescript
transport.onType('pong').subscribe(msg => {
  console.log('Got pong!', msg.payload);
});
```

### onTypes

```typescript
transport.onTypes(['error', 'result']).subscribe(msg => {
  // Handle multiple message types
});
```

## 🔌 Middleware

Middleware allows you to intercept and modify all messages going in or out.

### Example: Logger

```typescript
transport.use((msg, dir) => {
  console.log(`[${dir}]`, msg);
  return msg;
});
```

### Example: JSON Serializer

```typescript
transport.use((msg, dir) => {
  if (dir === 'out') {
    return { ...msg, payload: JSON.stringify(msg.payload) };
  } else {
    return { ...msg, payload: JSON.parse(msg.payload) };
  }
});
```

## 🧭 Lifecycle

```typescript
transport.start();      // Enables the transport lifecycle
transport.pause();      // Pauses reception (still buffers)
transport.resume();     // Resumes reception
transport.disconnect(); //
```

## 🧪 Testing

```bash
npm run test
```

### Load / Stress Test

```bash
load-test: 132ms
🧠 Memory usage diff:
heapUsed: +4.32 MB
rss: +5.01 MB
```
