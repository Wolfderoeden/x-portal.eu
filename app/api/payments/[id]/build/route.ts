import { createHash } from "node:crypto";
import { BlockfrostProvider, MeshTxBuilder, type UTxO } from "@meshsdk/core";
import { getDatabase } from "@/lib/database";
import { NextResponse } from "next/server";
import { z } from "zod";

const buildSchema = z.object({
  accessToken: z.string().min(30).max(100),
  changeAddress: z.string().startsWith("addr_test1"),
  utxos: z.array(z.unknown()).min(1).max(200),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = buildSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ message: "Invalid wallet data" }, { status: 400 });
  const tokenHash = createHash("sha256").update(body.data.accessToken).digest("hex");
  const db = getDatabase();
  const rows = await db.sql`
    SELECT pi.*
    FROM payment_intents pi
    JOIN reservations r ON r.id = pi.reservation_id
    WHERE pi.id = ${id} AND r.access_token_hash = ${tokenHash}
    LIMIT 1
  `;
  const intent = rows[0];
  if (!intent || intent.status !== "created") {
    return NextResponse.json({ message: "Payment intent is not available" }, { status: 409 });
  }
  if (new Date(String(intent.expires_at)).getTime() <= Date.now()) {
    await db.sql`UPDATE payment_intents SET status = 'expired' WHERE id = ${id}`;
    return NextResponse.json({ message: "Payment quote expired" }, { status: 410 });
  }
  const projectId = process.env.BLOCKFROST_PREPROD_PROJECT_ID;
  if (!projectId) return NextResponse.json({ message: "Preprod provider is not configured" }, { status: 503 });

  try {
    const provider = new BlockfrostProvider(projectId);
    const txBuilder = new MeshTxBuilder({ fetcher: provider, verbose: false });
    const unsignedTx = await txBuilder
      .txOut(String(intent.recipient_address), [
        { unit: "lovelace", quantity: String(intent.lovelace_amount) },
      ])
      .changeAddress(body.data.changeAddress)
      .selectUtxosFrom(body.data.utxos as UTxO[])
      .complete();
    return NextResponse.json({ unsignedTx });
  } catch {
    return NextResponse.json(
      { message: "Transaction could not be built. Check test ADA balance and wallet network." },
      { status: 422 },
    );
  }
}
