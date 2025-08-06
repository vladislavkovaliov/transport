import { BehaviorSubject, Observable, Subject, Subscription } from "rxjs";
import { IMessage, ITransport, Middleware } from "#/core/types";
export declare abstract class BaseTransport implements ITransport {
    protected $incomming: Subject<IMessage>;
    protected $isConnected: BehaviorSubject<boolean>;
    protected queue: IMessage[];
    protected middlewares: Middleware[];
    protected isStarted: boolean;
    protected isPaused: boolean;
    protected connectionSubcribtion: Subscription | null;
    protected sendFunction: (message: IMessage) => void;
    protected applyMiddleware(
        message: IMessage,
        direction: "in" | "out",
    ): IMessage | null;
    start(): void;
    pause(): void;
    stop(): void;
    resume(): void;
    connect(sendFunction: (message: IMessage) => void): void;
    disconnect(): void;
    send(message: IMessage): void;
    receive(msg: IMessage): void;
    onMessage(): Observable<IMessage>;
    onType<T = any>(
        type: string,
    ): Observable<{
        type: string;
        payload: T;
    }>;
    onTypes<T = any>(
        types: string[],
    ): Observable<{
        type: string;
        payload: T;
    }>;
    use(middleware: Middleware): void;
    protected flushQueue(): void;
}
