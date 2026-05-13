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
  const [isPending, startTransition] = useTransition();

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
          if (isProcessingRef.current) {
            return;
          }

          isProcessingRef.current = true;
          setResult(null);

          startTransition(() => {
            submitAttendanceQrScanAction(decodedText)
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
