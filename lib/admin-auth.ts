import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_COOKIE = "xportal_admin_session";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function adminSessionToken() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  return createHmac("sha256", secret)
    .update("xportal-admin-session-v1")
    .digest("hex");
}

export function validateAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected && password && safeEqual(password, expected));
}

export async function requireAdmin() {
  const expected = adminSessionToken();
  const cookieStore = await cookies();
  const received = cookieStore.get(ADMIN_COOKIE)?.value ?? "";

  if (!expected || !received || !safeEqual(received, expected)) {
    redirect("/admin/login");
  }
}
