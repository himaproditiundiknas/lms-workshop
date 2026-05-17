"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hashQrToken } from "@/lib/attendance/qr-token";
import { parseAttendanceQrPayload } from "@/lib/attendance/qr-payload";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export type ScanAttendanceResult = {
  ok: boolean;
  message: string;
  sessionTitle?: string;
  meetingNo?: number;
  workshopTitle?: string;
  cohortName?: string;
};

export async function submitAttendanceQrScanAction(
  rawPayload: string,
): Promise<ScanAttendanceResult> {
  const payload = parseAttendanceQrPayload(rawPayload);

  if (!payload) {
    return {
      ok: false,
      message: "QR tidak valid.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ok: false,
      message: "Session login tidak valid. Silakan login ulang.",
    };
  }

  const email = user.email.toLowerCase();

  // Rate limit QR scan attempts per email
  const rateLimitResult = checkRateLimit(email, RATE_LIMITS.qrScan);

  if (!rateLimitResult.allowed) {
    return {
      ok: false,
      message: "Terlalu banyak percobaan scan. Tunggu sebentar lalu coba lagi.",
    };
  }

  const tokenHash = hashQrToken(payload.token);
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const appUser = await tx.user.findUnique({
        where: {
          email,
        },
        include: {
          profile: true,
        },
      });

      if (!appUser) {
        return {
          ok: false,
          message: "Data user belum ditemukan. Silakan login ulang.",
        };
      }

      if (!appUser.profile?.profileCompletedAt) {
        return {
          ok: false,
          message: "Lengkapi profil terlebih dahulu sebelum absen.",
        };
      }

      const qrToken = await tx.qrToken.findUnique({
        where: {
          tokenHash,
        },
        include: {
          session: {
            include: {
              cohort: {
                include: {
                  workshop: true,
                },
              },
            },
          },
        },
      });

      if (!qrToken || qrToken.sessionId !== payload.sessionId) {
        return {
          ok: false,
          message: "Token QR tidak valid.",
        };
      }

      // Allow a small grace period to account for network latency between
      // the participant scanning the QR and the request reaching the server.
      // The QR display rotates every 5 seconds, but a scan at second 4.9
      // could arrive at second 5.1 on a slow connection.
      const QR_GRACE_PERIOD_MS = 3_000;
      const expiresWithGrace = new Date(
        qrToken.expiresAt.getTime() + QR_GRACE_PERIOD_MS,
      );

      if (expiresWithGrace <= now) {
        return {
          ok: false,
          message: "QR sudah kedaluwarsa. Silakan scan QR terbaru.",
        };
      }

      if (qrToken.session.attendanceStatus !== "OPEN") {
        return {
          ok: false,
          message: "Presensi sesi ini belum dibuka atau sudah ditutup.",
        };
      }

      const approvedEnrollment = await tx.enrollment.findFirst({
        where: {
          userId: appUser.id,
          cohortId: qrToken.session.cohortId,
          status: "APPROVED",
        },
      });

      if (!approvedEnrollment) {
        return {
          ok: false,
          message: "Kamu belum approved untuk cohort sesi ini.",
        };
      }

      const existingAttendance = await tx.attendance.findUnique({
        where: {
          sessionId_userId: {
            sessionId: qrToken.sessionId,
            userId: appUser.id,
          },
        },
      });

      if (existingAttendance) {
        return {
          ok: true,
          message: "Presensi kamu sudah tercatat sebelumnya.",
          sessionTitle: qrToken.session.title,
          meetingNo: qrToken.session.meetingNo,
          workshopTitle: qrToken.session.cohort.workshop.title,
          cohortName: qrToken.session.cohort.name,
        };
      }

      const attendance = await tx.attendance.create({
        data: {
          sessionId: qrToken.sessionId,
          userId: appUser.id,
          status: "PRESENT",
          method: "QR",
          checkedInAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: appUser.id,
          action: "attendance.qr_checked_in",
          entityType: "attendance",
          entityId: attendance.id,
          metadata: {
            sessionId: qrToken.sessionId,
            meetingNo: qrToken.session.meetingNo,
            sessionTitle: qrToken.session.title,
            cohortId: qrToken.session.cohortId,
            cohortName: qrToken.session.cohort.name,
            workshopId: qrToken.session.cohort.workshopId,
            workshopTitle: qrToken.session.cohort.workshop.title,
          },
        },
      });

      revalidatePath("/attendance/scan");

      return {
        ok: true,
        message: "Presensi berhasil dicatat.",
        sessionTitle: qrToken.session.title,
        meetingNo: qrToken.session.meetingNo,
        workshopTitle: qrToken.session.cohort.workshop.title,
        cohortName: qrToken.session.cohort.name,
      };
    });
  } catch (error) {
    console.error("Failed to submit QR attendance:", error);

    return {
      ok: false,
      message: "Gagal mencatat presensi. Coba lagi.",
    };
  }
}
