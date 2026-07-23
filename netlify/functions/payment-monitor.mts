import { getDatabase } from "../../lib/database";

type BlockfrostAmount = { unit: string; quantity: string };
type BlockfrostOutput = { address: string; amount: BlockfrostAmount[] };

const paymentMonitor = async () => {
  const projectId = process.env.BLOCKFROST_PREPROD_PROJECT_ID;
  if (!projectId) return;
  const db = getDatabase();
  await db.sql`
    UPDATE payment_intents
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'created' AND expires_at < NOW()
  `;
  const intents = await db.sql`
    SELECT * FROM payment_intents
    WHERE status = 'submitted' AND tx_hash IS NOT NULL
    ORDER BY updated_at ASC
    LIMIT 50
  `;
  const headers = { project_id: projectId };

  for (const intent of intents) {
    try {
      const [utxosResponse, txResponse, tipResponse] = await Promise.all([
        fetch(`https://cardano-preprod.blockfrost.io/api/v0/txs/${intent.tx_hash}/utxos`, { headers }),
        fetch(`https://cardano-preprod.blockfrost.io/api/v0/txs/${intent.tx_hash}`, { headers }),
        fetch("https://cardano-preprod.blockfrost.io/api/v0/blocks/latest", { headers }),
      ]);
      if (!utxosResponse.ok || !txResponse.ok || !tipResponse.ok) continue;
      const utxos = await utxosResponse.json() as { outputs: BlockfrostOutput[] };
      const transaction = await txResponse.json() as { block_height: number };
      const tip = await tipResponse.json() as { height: number };
      const paid = utxos.outputs
        .filter((output) => output.address === intent.recipient_address)
        .flatMap((output) => output.amount)
        .filter((amount) => amount.unit === "lovelace")
        .reduce((sum, amount) => sum + Number(amount.quantity), 0);
      const confirmations = Math.max(0, tip.height - transaction.block_height + 1);
      const expected = Number(intent.lovelace_amount);
      const status =
        paid < expected ? "underpaid"
          : paid > expected ? "overpaid"
            : confirmations >= 3 ? "confirmed"
              : "submitted";

      await db.sql`
        UPDATE payment_intents
        SET status = ${status}, confirmations = ${confirmations}, updated_at = NOW()
        WHERE id = ${intent.id}
      `;
      if (status === "confirmed") {
        await db.sql`
          UPDATE reservations SET status = 'reserved', updated_at = NOW()
          WHERE id = ${intent.reservation_id}
        `;
        await db.sql`
          UPDATE properties SET status = 'reserved', updated_at = NOW()
          WHERE id = (
            SELECT property_id FROM reservations WHERE id = ${intent.reservation_id}
          )
        `;
      }
    } catch {
      // The next scheduled run retries transient provider or database errors.
    }
  }
};

export default paymentMonitor;

export const config = {
  schedule: "*/2 * * * *",
};
