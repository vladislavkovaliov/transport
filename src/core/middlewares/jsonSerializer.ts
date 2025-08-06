import { Middleware } from "../types";

export function jsonSerializer(): Middleware {
    return (msg, direction) => {
        if (direction === "out") {
            return {
                type: msg.type,
                payload: JSON.stringify(msg.payload),
            };
        } else {
            try {
                return {
                    type: msg.type,
                    payload: JSON.parse(msg.payload),
                };
            } catch {
                return null;
            }
        }
    };
}
