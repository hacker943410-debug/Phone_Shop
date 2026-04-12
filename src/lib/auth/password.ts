import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;
const PASSWORD_SCHEME = "scrypt";

function toBuffer(value: string) {
  return Buffer.from(value, "hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("hex");

  return `${PASSWORD_SCHEME}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, salt, expectedHash] = storedHash.split("$");

  if (scheme !== PASSWORD_SCHEME || !salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  const expectedBuffer = toBuffer(expectedHash);

  if (expectedBuffer.length !== actualHash.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualHash);
}
