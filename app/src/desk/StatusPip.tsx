import type { ReactElement } from "react";
import type { Intent } from "@blueprintjs/core";
import css from "./desk.module.css";

export default function StatusPip({
  intent,
  children,
}: {
  intent: Intent;
  children: string;
}): ReactElement {
  return (
    <span className={css.statusPip} data-intent={intent}>
      {children}
    </span>
  );
}
