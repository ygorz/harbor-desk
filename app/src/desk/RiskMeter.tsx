import type { ReactElement } from "react";
import css from "./desk.module.css";

function riskLevel(value: number): "muted" | "primary" | "warning" | "danger" {
  if (value >= 75) return "danger";
  if (value >= 50) return "warning";
  if (value >= 30) return "primary";
  return "muted";
}

export default function RiskMeter({
  value,
  size = "compact",
}: {
  value: number;
  size?: "compact" | "full";
}): ReactElement {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const filled = clamped >= 67 ? 3 : clamped >= 34 ? 2 : clamped > 0 ? 1 : 0;

  return (
    <div
      className={css.riskMeter}
      data-level={riskLevel(clamped)}
      data-size={size}
    >
      <span className={css.riskTicks} aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={`${css.riskTick} ${index < filled ? css.riskTickOn : ""}`}
          />
        ))}
      </span>
      <span className={css.riskValue}>{clamped}</span>
    </div>
  );
}
