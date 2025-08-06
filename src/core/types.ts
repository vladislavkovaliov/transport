import { Observable } from "rxjs";

export interface IMessage {
    type: string;
    payload: any;
}

export interface ITransport {
    start(): void;
    stop(): void;
    pause(): void;
    resume(): void;

    connect(sendFn: (msg: IMessage) => void): void;
    disconnect(): void;

    send(msg: IMessage): void;
    receive(msg: IMessage): void;

    onMessage(): Observable<IMessage>;
    onType<T = any>(type: string): Observable<{ type: string; payload: T }>;
    onTypes<T = any>(types: string[]): Observable<{ type: string; payload: T }>;

    use(middleware: Middleware): void;
}

export type Middleware = (
    message: IMessage,
    direction: "in" | "out",
) => IMessage | null;
