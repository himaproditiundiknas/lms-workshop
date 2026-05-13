"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  generateAttendanceQrTokenAction,
  type GenerateAttendanceQrTokenResult,
} from "./actions";

type QrDisplayProps = {
  sessionId: string;
};

const REGENERATE_INTERVAL_MS = 5_000;

export function QrDisplay({ sessionId }: QrDisplayProps) {
  const [result, setResult] = useState<GenerateAttendanceQrTokenResult | null>(
    null,
  );
  const [remainingSeconds, setRemainingSeconds] = useState(5);
  const [isPending, startTransition] = useTransition();

  function generateToken() {
    startTransition(async () => {
      const nextResult = await generateAttendanceQrTokenAction(sessionId);
      setResult(nextResult);
      setRemainingSeconds(5);
    });
  }

  useEffect(() => {
    generateToken();

    const intervalId = window.setInterval(() => {
      generateToken();
    }, REGENERATE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [sessionId]);

  useEffect(() => {
    const countdownId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => {
      window.clearInterval(countdownId);
    };
  }, []);

  const qrValue = useMemo(() => {
    if (!result?.ok) {
      return "";
    }

    return result.qrPayload;
  }, [result]);

  if (result && !result.ok) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p className="font-medium">QR tidak tersedia</p>
        <p className="mt-2 text-sm">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl bg-white p-8 text-center shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">QR Presensi</h2>
        <p className="mt-2 text-sm text-slate-600">
          QR otomatis diperbarui setiap 5 detik.
        </p>
      </div>

      <div className="mx-auto flex h-80 w-80 items-center justify-center rounded-2xl border border-slate-200 bg-white p-6">
        {qrValue ? (
          <QRCodeSVG value={qrValue} size={260} level="M" includeMargin />
        ) : (
          <p className="text-sm text-slate-500">
            {isPending ? "Membuat QR..." : "Menunggu QR..."}
          </p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">
          Regenerate dalam {remainingSeconds} detik
        </p>
        {result?.ok ? (
          <p className="mt-1 text-xs text-slate-500">
            Token expires at{" "}
            {new Date(result.expiresAt).toLocaleTimeString("id-ID")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
