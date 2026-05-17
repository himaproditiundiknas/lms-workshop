import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  // Require authenticated user — do not expose database status publicly
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }

  try {
    await prisma.$queryRaw<{ now: Date }[]>`
      SELECT NOW() as now
    `;

    return NextResponse.json({
      ok: true,
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return NextResponse.json(
      {
        ok: false,
        database: "error",
      },
      { status: 500 },
    );
  }
}
