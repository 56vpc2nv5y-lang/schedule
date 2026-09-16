import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export const ACCOUNT_SESSION_COOKIE = "sunny_account_session_v2";
export const LEGACY_ACCOUNT_SESSION_COOKIES = ["sunny_account_session"] as const;
export const ACCOUNT_SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export type SessionAccount = {
  id: string;
  email: string;
  displayName: string;
  kind: "owner" | "demo" | "user";
};

type SessionPayload = SessionAccount & { exp: number };

function sessionSecret() {
  const configured = (process.env.AUTH_SECRET ?? "").trim();
  if (configured) return configured;
  return createHash("sha256")
    .update(`sunny-local:${process.env.APP_PASSWORD ?? "development"}`)
    .digest("hex");
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function displayNameFromEmail(email: string) {
  return normalizeEmail(email).split("@")[0] || "user";
}

export function createAccountSession(account: SessionAccount) {
  const payload: SessionPayload = {
    ...account,
    email: normalizeEmail(account.email),
    exp: Math.floor(Date.now() / 1000) + ACCOUNT_SESSION_MAX_AGE,
  };
  const encoded = encode(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifyAccountSession(token: string | undefined | null): SessionAccount | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.id || !payload.email || !payload.displayName || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return {
      id: payload.id,
      email: normalizeEmail(payload.email),
      displayName: payload.displayName,
      kind: payload.kind === "owner" || payload.kind === "demo" ? payload.kind : "user",
    };
  } catch {
    return null;
  }
}

export function verifyAnyAccountSession(tokens: Array<string | undefined | null>): SessionAccount | null {
  for (const token of tokens) {
    const account = verifyAccountSession(token);
    if (account) return account;
  }
  return null;
}

export async function hashAccountPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyAccountPassword(password: string, stored: string) {
  const [algorithm, salt, expectedHex] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function getBuiltinAccount(emailValue: string, password: string): SessionAccount | null {
  const email = normalizeEmail(emailValue);
  const ownerEmail = normalizeEmail(process.env.OWNER_EMAIL ?? "zhangjingyi@gsafety.com");
  const ownerPassword = process.env.OWNER_INITIAL_PASSWORD ?? "";
  if (ownerPassword && email === ownerEmail && password === ownerPassword) {
    return { id: "builtin-owner", email: ownerEmail, displayName: displayNameFromEmail(ownerEmail), kind: "owner" };
  }

  const demoEmail = normalizeEmail(process.env.DEMO_EMAIL ?? "demo@gsafety.com");
  const demoPassword = process.env.DEMO_PASSWORD ?? "";
  if (demoPassword && email === demoEmail && password === demoPassword) {
    return { id: "builtin-demo", email: demoEmail, displayName: "competition-demo", kind: "demo" };
  }
  return null;
}
