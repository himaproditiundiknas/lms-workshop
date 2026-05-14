export type AttendanceQrPayload = {
  type: "attendance";
  sessionId: string;
  token: string;
};

export function createAttendanceQrPayload({
  sessionId,
  token,
}: {
  sessionId: string;
  token: string;
}) {
  const payload: AttendanceQrPayload = {
    type: "attendance",
    sessionId,
    token,
  };

  return JSON.stringify(payload);
}

export function parseAttendanceQrPayload(value: string) {
  try {
    const parsed = JSON.parse(value) as Partial<AttendanceQrPayload>;

    if (
      parsed.type !== "attendance" ||
      typeof parsed.sessionId !== "string" ||
      typeof parsed.token !== "string"
    ) {
      return null;
    }

    return {
      type: parsed.type,
      sessionId: parsed.sessionId,
      token: parsed.token,
    } satisfies AttendanceQrPayload;
  } catch {
    return null;
  }
}
