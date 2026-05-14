"use server";

import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { generateQrToken, hashQrToken } from "@/lib/attendance/qr-token";
import { createAttendanceQrPayload } from "@/lib/attendance/qr-payload";

const QR_TOKEN_TTL_MS = 5_000;

export type GenerateAttendanceQrTokenResult =
  | {
      ok: true;
      qrPayload: string;
      expiresAt: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function generateAttendanceQrTokenAction(
  sessionId: string,
): Promise<GenerateAttendanceQrTokenResult> {
  const actor = await requireMentorOrAdmin();

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    select: {
      id: true,
      attendanceStatus: true,
    },
  });

  if (!session) {
    return {
      ok: false,
      message: "Sesi tidak ditemukan.",
    };
  }

  if (session.attendanceStatus !== "OPEN") {
    return {
      ok: false,
      message: "Presensi belum dibuka atau sudah ditutup.",
    };
  }

  const plainToken = generateQrToken();
  const tokenHash = hashQrToken(plainToken);
  const expiresAt = new Date(Date.now() + QR_TOKEN_TTL_MS);

  await prisma.$transaction(async (tx) => {
    await tx.qrToken.deleteMany({
      where: {
        sessionId: session.id,
      },
    });

    await tx.qrToken.create({
      data: {
        sessionId: session.id,
        tokenHash,
        expiresAt,
        createdById: actor.id,
      },
    });
  });

  return {
    ok: true,
    qrPayload: createAttendanceQrPayload({
      sessionId: session.id,
      token: plainToken,
    }),
    expiresAt: expiresAt.toISOString(),
  };
}
