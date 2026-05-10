import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await prisma.$queryRaw<{ now: Date }[]>`
      SELECT NOW() as now
    `;

    return NextResponse.json({
      ok: true,
      database: "connected",
      now: result[0]?.now,
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        ok: false,
        database: "error",
        message:
          error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 },
    );
  }
}
