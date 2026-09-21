import Redis from "ioredis";
import { sendEvent } from "./sse";

const redisSubscriber = new Redis(
    process.env.REDIS_URL || "redis://localhost:6379"
);

export const startRedisSubscriber = async () => {
    try {
        await redisSubscriber.subscribe("payment.updated");

        console.log("Redis subscriber connected");
        console.log("Subscribed to payment.updated");

        redisSubscriber.on("message", (channel, message) => {
            if (channel !== "payment.updated") {
                return;
            }

            const data = JSON.parse(message);

            console.log("Redis event received:", data);

            sendEvent(
                String(data.account_id),
                data
            );
        });
    } catch (error) {
        console.error("Redis subscriber failed:", error);
    }
};

redisSubscriber.on("error", (error) => {
    console.error("Redis subscriber error:", error);
});