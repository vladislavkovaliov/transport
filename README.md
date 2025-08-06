

```typescript
import { WebSocketTransport } from './WebSocketTransport';
import { jsonSerializer } from './middlewares';

const transport = new WebSocketTransport('wss://example.com');

transport.use(jsonSerializer());
transport.start();
transport.connect();

transport.onType('chat').subscribe(({ payload }) => {
  console.log('Chat message:', payload.text);
});

transport.send({ type: 'chat', payload: { text: 'Hello world' } });
```