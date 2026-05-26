import { NextResponse } from "next/server";
import { isDatabaseAvailable } from "@/lib/app-auth";
import { isRedisConfigured } from "@/lib/jobs/connection";

async function isRedisReachable(): Promise<boolean> {
  if (!isRedisConfigured()) return false;
  try {
    const { getRedisConnection } = await import("@/lib/jobs/connection");
    const redis = getRedisConnection();
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const [database, redisReachable] = await Promise.all([
    isDatabaseAvailable(),
    isRedisReachable(),
  ]);

  const healthy = database;
  const status = healthy ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      service: "revenue-autopilot-web",
      timestamp: new Date().toISOString(),
      database,
      redis: {
        configured: isRedisConfigured(),
        reachable: redisReachable,
      },
    },
    { status: healthy ? 200 : 503 }
  );
}
