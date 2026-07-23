import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminSessionMaxAge,
  createAdminSession,
  isMfaConfigured,
  validateAdminPassword,
  validateTotp,
} from "../../../../lib/admin-auth";

function loginRedirect(error: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: `/admin/login?error=${error}` },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");
  const totp = String(formData.get("totp") ?? "");
  const mfaConfigured = isMfaConfigured();

  if (!process.env.ADMIN_SESSION_SECRET || !process.env.ADMIN_PASSWORD) {
    return loginRedirect("config");
  }
  if (!validateAdminPassword(password)) {
    return loginRedirect("invalid");
  }
  if (mfaConfigured && !validateTotp(totp)) {
    return loginRedirect("mfa");
  }

  const session = createAdminSession("owner", mfaConfigured);
  if (!session) return loginRedirect("config");

  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin" },
  });
  response.cookies.set(ADMIN_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: adminSessionMaxAge(),
  });
  return response;
}
