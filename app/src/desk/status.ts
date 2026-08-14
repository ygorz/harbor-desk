import type { Intent } from "@blueprintjs/core";
import { PalantirApiError } from "@osdk/client";

export const STATUS_OPEN = "Open";
export const STATUS_IN_REVIEW = "In review";
export const STATUS_PENDING_CLOSE = "Pending close";
export const STATUS_CLOSED = "Closed";

export const FINDING_OPEN = "Open";
export const FINDING_MITIGATED = "Mitigated";

export const MAYA_ID = "ANALYST-MAYA";
export const HERO_CASE_ID = "CASE-2041";

export const SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;

export function isActiveCase(status: string | undefined): boolean {
  return (
    status === STATUS_OPEN ||
    status === STATUS_IN_REVIEW ||
    status === STATUS_PENDING_CLOSE
  );
}

export function statusIntent(status: string | undefined): Intent {
  switch (status) {
    case STATUS_CLOSED:
      return "success";
    case STATUS_PENDING_CLOSE:
    case STATUS_IN_REVIEW:
      return "warning";
    case STATUS_OPEN:
      return "primary";
    default:
      return "none";
  }
}

export function severityIntent(severity: string | undefined): Intent {
  switch (severity) {
    case "Critical":
      return "danger";
    case "High":
      return "warning";
    case "Medium":
      return "primary";
    default:
      return "none";
  }
}

export function errorMessage(caught: unknown): string {
  if (caught != null && typeof caught === "object") {
    const params = (caught as { parameters?: { message?: unknown } }).parameters;
    if (typeof params?.message === "string" && params.message.trim() !== "") {
      return params.message;
    }
  }
  if (caught instanceof PalantirApiError) {
    if (caught.errorDescription != null && caught.errorDescription !== "") {
      return caught.errorDescription;
    }
  }
  if (caught instanceof Error && caught.message.trim() !== "") {
    return caught.message;
  }
  return String(caught);
}
