import { createHash } from "crypto";

export function normalizeInvitationCode(code: string) {
  return code.trim().toUpperCase();
}

export function hashInvitationCode(code: string) {
  return createHash("sha256")
    .update(normalizeInvitationCode(code))
    .digest("hex");
}
