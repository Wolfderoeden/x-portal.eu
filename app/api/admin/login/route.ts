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
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/admin/login?error=config" },
    });
  }

  if (!validateAdminPassword(password)) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/admin/login?error=invalid" },
    });
  }

  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin" },
  });
  response.cookies.set(ADMIN_COOKIE, session, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
