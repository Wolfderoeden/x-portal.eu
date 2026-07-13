import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminSessionToken,
  validateAdminPassword,
} from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const session = adminSessionToken();

  if (!session || !process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL("/admin/login?error=config", request.url), 303);
  }

  if (!validateAdminPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=invalid", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set(ADMIN_COOKIE, session, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
