"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Html5QrcodeScanner } from "html5-qrcode";
import {
  submitAttendanceQrScanAction,
  type ScanAttendanceResult,
} from "./actions";

const READER_ELEMENT_ID = "attendance-qr-reader";

export function AttendanceQrScanner() {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isProcessingRef = useRef(false);

  const [result, setResult] = useState<ScanAttendanceResult | null>(null);
  const [manualPayload, setManualPayload] = useState("");
  const [isPending, startTransition] = useTransition();

  function processPayload(payload: string) {
    if (!payload.trim() || isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setResult(null);

    startTransition(() => {
      submitAttendanceQrScanAction(payload)
        .then((nextResult) => {
          setResult(nextResult);

          if (nextResult.ok) {
            scannerRef.current?.clear().catch(() => {});
          }
        })
        .finally(() => {
          isProcessingRef.current = false;
        });
    });
  }

  function submitManualPayload() {
    processPayload(manualPayload);
  }

  useEffect(() => {
    let isMounted = true;

    async function setupScanner() {
      const { Html5QrcodeScanner } = await import("html5-qrcode");

      if (!isMounted) {
        return;
      }

      const scanner = new Html5QrcodeScanner(
        READER_ELEMENT_ID,
        {
          fps: 10,
          qrbox: {
            width: 260,
            height: 260,
          },
          rememberLastUsedCamera: true,
        },
        false,
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          processPayload(decodedText);
        },
        () => {
          // Ignore scan failures while camera is searching for QR.
        },
      );
    }

    setupScanner();

    return () => {
      isMounted = false;

      scannerRef.current?.clear().catch(() => {});
      scannerRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div id={READER_ELEMENT_ID} />
      </div>

      {process.env.NODE_ENV === "development" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label
            htmlFor="manualPayload"
            className="block text-sm font-medium text-slate-700"
          >
            Debug Manual QR Payload
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Paste QR payload dari halaman mentor QR untuk testing tanpa kamera.
          </p>

          <textarea
            id="manualPayload"
            value={manualPayload}
            onChange={(event) => setManualPayload(event.target.value)}
            rows={4}
            placeholder='Contoh: {"type":"attendance","sessionId":"...","token":"..."}'
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-950 outline-none transition focus:border-slate-950"
          />

          <button
            type="button"
            onClick={submitManualPayload}
            disabled={isPending || !manualPayload.trim()}
            className="mt-3 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Memproses..." : "Submit Debug Payload"}
          </button>
        </div>
      ) : null}

      {isPending ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          Memproses QR...
        </div>
      ) : null}

      {result ? (
        <div
          className={
            result.ok
              ? "rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              : "rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          }
        >
          <p className="font-medium">{result.message}</p>

          {result.ok ? (
            <div className="mt-3 space-y-1 text-xs">
              <p>
                <span className="font-medium">Workshop:</span>{" "}
                {result.workshopTitle}
              </p>
              <p>
                <span className="font-medium">Cohort:</span> {result.cohortName}
              </p>
              <p>
                <span className="font-medium">Meeting:</span> #
                {result.meetingNo}
              </p>
              <p>
                <span className="font-medium">Sesi:</span> {result.sessionTitle}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
