/**
 * Shared casework policy. Mutating functions import from here so weights and
 * status transitions stay in one place.
 */

import { UserFacingError } from "@osdk/functions";

// =============================================================================
// Case status
// =============================================================================

export const STATUS_OPEN = "Open";
export const STATUS_IN_REVIEW = "In review";
export const STATUS_PENDING_CLOSE = "Pending close";
export const STATUS_CLOSED = "Closed";

// =============================================================================
// Finding status
// =============================================================================

export const FINDING_OPEN = "Open";
export const FINDING_MITIGATED = "Mitigated";

// =============================================================================
// Severity and risk
// =============================================================================

export const SEVERITY_LOW = "Low";
export const SEVERITY_MEDIUM = "Medium";
export const SEVERITY_HIGH = "High";
export const SEVERITY_CRITICAL = "Critical";

export const SEVERITIES = [
    SEVERITY_LOW,
    SEVERITY_MEDIUM,
    SEVERITY_HIGH,
    SEVERITY_CRITICAL,
] as const;

export type Severity = (typeof SEVERITIES)[number];

const WEIGHTS: Record<Severity, number> = {
    [SEVERITY_CRITICAL]: 40,
    [SEVERITY_HIGH]: 25,
    [SEVERITY_MEDIUM]: 12,
    [SEVERITY_LOW]: 5,
};

/** Open → In review at this score. CASE-2041 seeds at 65 (Critical + High open). */
export const REVIEW_THRESHOLD = 50;

export function isKnownSeverity(
    severity: string | undefined,
): severity is Severity {
    return (
        severity != null && (SEVERITIES as readonly string[]).includes(severity)
    );
}

export function assertKnownSeverity(
    severity: string | undefined,
): asserts severity is Severity {
    if (!isKnownSeverity(severity)) {
        throw new UserFacingError(
            "Severity must be Low, Medium, High, or Critical.",
        );
    }
}

export function severityWeight(severity: string | undefined): number {
    if (!isKnownSeverity(severity)) return 0;
    return WEIGHTS[severity];
}

/** Pending close and Closed cannot gain or lose findings. */
export function isFindingsFrozen(status: string | undefined): boolean {
    return status === STATUS_CLOSED || status === STATUS_PENDING_CLOSE;
}

/** Clamp to 0–100. Writeback types cannot use derived properties. */
export function cappedRisk(score: number): number {
    return Math.max(0, Math.min(100, score));
}

/**
 * Escalate Open → In review at REVIEW_THRESHOLD.
 * Leaves Closed and Pending close alone. Does not de-escalate In review.
 */
export function statusAfterRisk(
    currentStatus: string | undefined,
    riskScore: number,
): string {
    if (currentStatus === STATUS_CLOSED || currentStatus === STATUS_PENDING_CLOSE) {
        return currentStatus;
    }
    if (riskScore >= REVIEW_THRESHOLD && currentStatus === STATUS_OPEN) {
        return STATUS_IN_REVIEW;
    }
    return currentStatus ?? STATUS_OPEN;
}

/**
 * Blocks opening a second case on the same subject. Pending close still
 * counts — four-eyes is in flight.
 */
export function isActiveCase(status: string | undefined): boolean {
    return (
        status === STATUS_OPEN ||
        status === STATUS_IN_REVIEW ||
        status === STATUS_PENDING_CLOSE
    );
}
