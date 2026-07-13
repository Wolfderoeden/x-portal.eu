import { NextResponse } from "next/server";
import { addWhitelistEntry } from "../../../lib/whitelist";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const country = String(formData.get("country") ?? "").trim();
    const consent = formData.get("consent") === "yes";
    const website = String(formData.get("website") ?? "").trim();

    if (website) return redirectTo(request, "/?joined=1#whitelist");

    if (
      fullName.length < 2 ||
      fullName.length > 100 ||
      email.length > 160 ||
      !EMAIL_PATTERN.test(email) ||
      country.length < 2 ||
      country.length > 80 ||
      !consent
    ) {
      return redirectTo(request, "/?error=1#whitelist");
    }

    await addWhitelistEntry({ fullName, email, country });
    return redirectTo(request, "/?joined=1#whitelist");
  } catch {
    return redirectTo(request, "/?error=1#whitelist");
  }
}
