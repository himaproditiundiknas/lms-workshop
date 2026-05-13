import { createHash, randomBytes } from "crypto";

export function normalizeInvitationCode(code: string) {
  return code.trim().toUpperCase();
}

export function hashInvitationCode(code: string) {
  return createHash("sha256")
    .update(normalizeInvitationCode(code))
    .digest("hex");
}

export function generateInvitationCode() {
  const first = randomBytes(3).toString("hex").toUpperCase();
  const second = randomBytes(3).toString("hex").toUpperCase();

  return `LMS-${first}-${second}`;
}
