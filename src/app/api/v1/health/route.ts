import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { logger } from "@/lib/observability/logger";

export async function GET() {
  try {
    // Check database connectivity
    await db.execute(sql`SELECT 1`);

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Health check failed", { error });
    return NextResponse.json(
      {
        status: "degraded",
        database: "disconnected",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
