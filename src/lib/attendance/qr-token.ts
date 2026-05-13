import { createHash, randomBytes } from "crypto";

export function normalizeQrToken(token: string) {
  return token.trim();
}

export function hashQrToken(token: string) {
  return createHash("sha256").update(normalizeQrToken(token)).digest("hex");
}

export function generateQrToken() {
  return randomBytes(32).toString("base64url");
}
