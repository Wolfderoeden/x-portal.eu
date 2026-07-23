import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminRole } from "./domain";

export const ADMIN_COOKIE = "xportal_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

export type AdminSession = {
  sub: string;
  role: AdminRole;
  exp: number;
};

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function signingSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? "";
}

function signature(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createAdminSession(role: AdminRole = "owner") {
  if (!signingSecret()) return null;
  const payload: AdminSession = {
    sub: "environment-admin",
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function parseAdminSession(token: string): AdminSession | null {
  if (!token || !signingSecret()) return null;
  const [encoded, receivedSignature] = token.split(".");
  if (!encoded || !receivedSignature || !safeEqual(signature(encoded), receivedSignature)) {
    return null;
  }
  try {
    const session = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as AdminSession;
    if (session.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!["owner", "compliance", "operations", "viewer"].includes(session.role)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function validateAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected && password && safeEqual(password, expected));
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return parseAdminSession(cookieStore.get(ADMIN_COOKIE)?.value ?? "");
}

export async function requireAdmin(roles?: AdminRole[]) {
  const session = await getAdminSession();
  if (!session || (roles && !roles.includes(session.role))) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireAdminApi(roles?: AdminRole[]) {
  const session = await getAdminSession();
  if (!session || (roles && !roles.includes(session.role))) {
    return null;
  }
  return session;
}

export function adminSessionMaxAge() {
  return SESSION_SECONDS;
}
