import { NextResponse } from "next/server";
import { addWhitelistEntry } from "../../../lib/whitelist";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function redirectTo(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path },
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const country = String(formData.get("country") ?? "").trim();
    const company = String(formData.get("company") ?? "").trim();
    const locale = formData.get("locale") === "de" ? "de" : "en";
    const basePath = locale === "de" ? "/de" : "/";
    const consent = formData.get("consent") === "yes";
    const website = String(formData.get("website") ?? "").trim();

    if (website) return redirectTo(`${basePath}?joined=1#whitelist`);

    if (
      fullName.length < 2 ||
      fullName.length > 100 ||
      email.length > 160 ||
      !EMAIL_PATTERN.test(email) ||
      country.length < 2 ||
      country.length > 80 ||
      company.length > 160 ||
      !consent
    ) {
      return redirectTo(`${basePath}?error=1#whitelist`);
    }

    await addWhitelistEntry({ fullName, email, country, company });
    return redirectTo(`${basePath}?joined=1#whitelist`);
  } catch {
    return redirectTo("/?error=1#whitelist");
  }
}
