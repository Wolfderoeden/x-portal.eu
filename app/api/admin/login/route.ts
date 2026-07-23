import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminSessionMaxAge,
  createAdminSession,
  validateAdminPassword,
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

  if (!process.env.ADMIN_SESSION_SECRET || !process.env.ADMIN_PASSWORD) {
    return loginRedirect("config");
  }
  if (!validateAdminPassword(password)) {
    return loginRedirect("invalid");
  }
  const session = createAdminSession("owner");
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
