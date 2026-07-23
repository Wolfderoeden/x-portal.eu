import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminSession } from "../lib/admin-auth";

export default function AdminShell({
  session,
  children,
}: {
  session: AdminSession;
  children: ReactNode;
}) {
  return (
    <main className="admin-dashboard">
      <header className="admin-topbar">
        <Link href="/admin" className="admin-brand" aria-label="XPORTAL admin home">
          <Image src="/xportal-logo.jpg" alt="" width={42} height={42} />
          <span>XPORTAL / OPERATIONS</span>
        </Link>
        <nav className="admin-nav" aria-label="Admin sections">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/properties/new">New property</Link>
          <Link href="/admin/reservations">Reservations</Link>
          <Link href="/admin/compliance">Compliance</Link>
        </nav>
        <div className="admin-user">
          <span>{session.role} / password protected</span>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="admin-signout">Sign out</button>
          </form>
        </div>
      </header>
      {children}
    </main>
  );
}
