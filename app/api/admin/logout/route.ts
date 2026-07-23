import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "../../../../lib/admin-auth";

export async function POST() {
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin/login" },
  });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
