import Redis from 'ioredis';

export const redisClient = new Redis(
    process.env.REDIS_URL || 'redis://localhost:6379',
)

redisClient.on('connect', () => {
    console.log('Connected to Redis successfully');
});

redisClient.on('error', (error) => {
    console.error('Redis publisher error:', error);
});

export const redisPublish = async (channel: string, message: any) => {
    try {
        await redisClient.publish(channel, JSON.stringify(message));
    } catch (error) {
        console.error(`Failed to publish message to channel ${channel}:`, error);
    }
}
