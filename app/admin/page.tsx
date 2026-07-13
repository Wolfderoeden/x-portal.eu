import Image from "next/image";
import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { listWhitelistEntries } from "../../db/whitelist";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(new Date(value.replace(" ", "T") + "Z"));
}

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const entries = await listWhitelistEntries();

  return (
    <main className="admin-dashboard">
      <header className="admin-topbar">
        <Link href="/" className="admin-brand" aria-label="XPORTAL home">
          <Image src="/xportal-logo.jpg" alt="XPORTAL" width={44} height={44} />
          <span>XPORTAL / ADMIN</span>
        </Link>
        <div className="admin-user">
          <span>{user.email}</span>
          <a href="/signout-with-chatgpt?return_to=/">Sign out</a>
        </div>
      </header>

      <section className="admin-content" aria-labelledby="admin-title">
        <div className="admin-heading">
          <div>
            <p className="section-label">Private control center</p>
            <h1 id="admin-title">Whitelist</h1>
          </div>
          <div className="entry-count">
            <strong>{entries.length}</strong>
            <span>Total requests</span>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="empty-state">
            <span>00</span>
            <h2>No entries yet.</h2>
            <p>New whitelist requests will appear here automatically.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Country</th>
                  <th scope="col">Received</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label="Name">{entry.fullName}</td>
                    <td data-label="Email">
                      <a href={`mailto:${entry.email}`}>{entry.email}</a>
                    </td>
                    <td data-label="Country">{entry.country}</td>
                    <td data-label="Received">{formatDate(entry.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
