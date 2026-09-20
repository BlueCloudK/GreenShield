import crypto from "node:crypto";

function encryptionKey() {
  const configured = process.env.SECRET_ENCRYPTION_KEY;
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new Error("SECRET_ENCRYPTION_KEY is required in production");
  }
  return crypto.createHash("sha256").update(configured || "greenshield-local-development-key").digest();
}

export function encryptSecret(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((item) => item.toString("base64url")).join(".");
}

export function decryptSecret(value) {
  if (!value) return "";
  const [iv, tag, encrypted] = value.split(".").map((item) => Buffer.from(item, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

