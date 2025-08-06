import {
    BehaviorSubject,
    filter,
    Observable,
    Subject,
    Subscription,
} from "rxjs";
// project deps
import { IMessage, ITransport, Middleware } from "#/core/types";

export abstract class BaseTransport implements ITransport {
    protected $incomming = new Subject<IMessage>();

    protected $isConnected = new BehaviorSubject<boolean>(false);

    protected queue: IMessage[] = [];

    protected middlewares: Middleware[] = [];

    protected isStarted = false;

    protected isPaused = false;

    protected connectionSubcribtion: Subscription | null = null;

    protected sendFunction: (message: IMessage) => void = () => undefined;

    protected applyMiddleware(
        message: IMessage,
        direction: "in" | "out",
    ): IMessage | null {
        return this.middlewares.reduce<IMessage | null>((prev, middleware) => {
            if (prev) {
                return middleware(message, direction);
            } else {
                return null;
            }
        }, message);
    }

    public start(): void {
        // console.log("start(): void", this.isStarted)
        if (this.isStarted) {
            return;
        }

        this.isStarted = true;
        // console.log("start(): void 2", this.isStarted)

        this.connectionSubcribtion = this.$isConnected
            .pipe(filter((x) => x))
            .subscribe(() => this.flushQueue());
    }

    public pause(): void {
        if (this.isStarted === false) {
            return;
        }

        this.isPaused = true;

        this.$isConnected.next(false);
    }

    public stop(): void {
        if (this.isStarted === false) {
            return;
        }

        this.disconnect();

        if (this.connectionSubcribtion) {
            this.connectionSubcribtion?.unsubscribe();
        }

        this.connectionSubcribtion = null;
        this.queue = [];

        this.isStarted = false;
        this.isPaused = false;
    }

    public resume(): void {
        if (this.isStarted === false || this.isPaused === false) {
            return;
        }

        this.isPaused = false;

        this.$isConnected.next(true);
    }

    public connect(sendFunction: (message: IMessage) => void): void {
        // console.log("base transport connect")
        this.sendFunction = sendFunction;

        if (this.isPaused === false) {
            this.$isConnected.next(true);
        }
    }

    public disconnect(): void {
        this.$isConnected.next(false);
    }

    public send(message: IMessage) {
        const processed = this.applyMiddleware(message, "out");

        if (processed === null) {
            return;
        }

        if (this.$isConnected.value) {
            this.sendFunction(processed);
        } else {
            this.queue.push(processed);
        }
    }

    public receive(msg: IMessage): void {
        if (this.isStarted === false) {
            return;
        }

        const processed = this.applyMiddleware(msg, "in");

        if (processed) {
            this.$incomming.next(processed);
        }
    }

    public onMessage(): Observable<IMessage> {
        return this.$incomming.asObservable();
    }

    public onType<T = any>(
        type: string,
    ): Observable<{ type: string; payload: T }> {
        return this.onMessage().pipe(filter((msg) => msg.type === type));
    }

    public onTypes<T = any>(
        types: string[],
    ): Observable<{ type: string; payload: T }> {
        return this.onMessage().pipe(filter((msg) => types.includes(msg.type)));
    }

    public use(middleware: Middleware): void {
        this.middlewares.push(middleware);
    }

    protected flushQueue() {
        while (this.queue.length > 0) {
            const message = this.queue.shift();

            if (message) {
                this.sendFunction(message);
            }
        }
    }
}
