"use client";

import { useState } from "react";
import { BrowserWallet } from "@meshsdk/wallet";

type InstalledWallet = { id: string; name: string; icon: string };

export default function WalletPayment({
  intentId,
  accessToken,
  lovelaceAmount,
  recipientAddress,
}: {
  intentId: string;
  accessToken: string;
  lovelaceAmount: number;
  recipientAddress: string;
}) {
  const [wallets] = useState<InstalledWallet[]>(() =>
    typeof window === "undefined" ? [] : BrowserWallet.getInstalledWallets(),
  );
  const [selected, setSelected] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function pay() {
    if (!selected) return;
    setBusy(true);
    setStatus("Waiting for wallet permission…");
    try {
      const wallet = await BrowserWallet.enable(selected);
      const networkId = await wallet.getNetworkId();
      const changeAddress = await wallet.getChangeAddress();
      if (networkId !== 0 || !changeAddress.startsWith("addr_test1")) {
        throw new Error("Switch the wallet to Cardano Preprod before continuing.");
      }
      const utxos = await wallet.getUtxos();
      setStatus("Building the exact Preprod transaction…");
      const buildResponse = await fetch(`/api/payments/${intentId}/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, changeAddress, utxos }),
      });
      const built = (await buildResponse.json()) as { unsignedTx?: string; message?: string };
      if (!buildResponse.ok || !built.unsignedTx) throw new Error(built.message ?? "Transaction build failed.");

      setStatus("Review and sign in your wallet. XPORTAL never sees your keys.");
      const signedTx = await wallet.signTx(built.unsignedTx, false, true);
      const txHash = await wallet.submitTx(signedTx);
      const submitResponse = await fetch(`/api/payments/${intentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, txHash }),
      });
      if (!submitResponse.ok) throw new Error("Transaction submitted, but status recording failed. Keep the transaction ID.");
      setStatus(`Submitted on Preprod: ${txHash}. Confirmation monitoring is active.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The wallet request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wallet-payment">
      <div className="payment-facts">
        <div><span>Network</span><strong>Cardano Preprod</strong></div>
        <div><span>Amount</span><strong>{(lovelaceAmount / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 6 })} ADA</strong></div>
        <div><span>Recipient</span><code>{recipientAddress}</code></div>
      </div>
      {wallets.length === 0 ? (
        <p className="wallet-status">Install a CIP-30 wallet such as Lace, Eternl or Nami and switch it to Preprod.</p>
      ) : (
        <>
          <label>
            Wallet
            <select value={selected} onChange={(event) => setSelected(event.target.value)}>
              <option value="">Choose an installed wallet</option>
              {wallets.map((wallet) => <option value={wallet.id} key={wallet.id}>{wallet.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={pay} disabled={!selected || busy}>
            {busy ? "Wallet request active…" : "Connect, review and sign"}
          </button>
        </>
      )}
      {status && <p className="wallet-status" role="status">{status}</p>}
    </div>
  );
}
