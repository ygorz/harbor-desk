import type { ReactElement } from "react";
import { Button } from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import { wallet } from "@ontology/sdk";
import { copyText, formatAddress } from "./format";
import { showCopied, showError } from "./toast";
import css from "./desk.module.css";

export default function WalletRow({
  item,
}: {
  item: Osdk.Instance<wallet>;
}): ReactElement {
  const address = item.address ?? "";

  async function copy(): Promise<void> {
    if (address === "") return;
    const ok = await copyText(address);
    if (ok) showCopied();
    else showError("Could not copy the address.");
  }

  return (
    <div className={css.walletRow}>
      <span className={css.walletLabel}>{item.label}</span>
      {item.chain != null && item.chain !== "" && (
        <span className={css.walletChain}>{item.chain}</span>
      )}
      <span
        className={css.walletAddress}
        title={address}
        translate="no"
      >
        {formatAddress(address)}
      </span>
      {address !== "" && (
        <Button
          variant="minimal"
          size="small"
          icon="clipboard"
          aria-label="Copy address"
          onClick={() => void copy()}
        />
      )}
    </div>
  );
}
