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
