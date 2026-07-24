import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin Login — XPORTAL",
  robots: { index: false, follow: false },
};

type LoginProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginProps) {
  const error = (await searchParams)?.error;

  return (
    <main className="admin-login-page">
      <Link href="/" className="login-brand" aria-label="Back to XPORTAL">
        <Image src="/xportal-logo.jpg" alt="XPORTAL" width={54} height={54} />
      </Link>

      <section className="login-panel" aria-labelledby="login-title">
        <p className="form-eyebrow">XPORTAL / PRIVATE CONTROL</p>
        <h1 id="login-title">Admin access.</h1>
        <p>
          Sign in to the private property, compliance and buyer workspace.
        </p>

        {error === "invalid" && (
          <p className="login-error" role="alert">Incorrect password.</p>
        )}
        {error === "config" && (
          <p className="login-error" role="alert">Admin access is not configured.</p>
        )}

        <form action="/api/admin/login" method="post" className="login-form">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
          />
          <button type="submit">Unlock admin <span aria-hidden="true">-&gt;</span></button>
        </form>
      </section>
    </main>
  );
}
