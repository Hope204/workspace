import { createHash, timingSafeEqual } from "crypto";

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, passwordHash: string) {
  const candidate = Buffer.from(hashPassword(password), "hex");
  const stored = Buffer.from(passwordHash, "hex");
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}
