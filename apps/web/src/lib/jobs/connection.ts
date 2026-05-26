import IORedis from "ioredis";

let connection: IORedis | null = null;

export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

export function getRedisConnection(): IORedis {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured");
  }

  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return connection;
}

export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
