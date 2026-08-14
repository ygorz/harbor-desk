export const STATUS_OPEN = "Open";
export const STATUS_IN_REVIEW = "In review";
export const STATUS_PENDING_CLOSE = "Pending close";
export const STATUS_CLOSED = "Closed";

export const FINDING_OPEN = "Open";
export const FINDING_MITIGATED = "Mitigated";

export const SEVERITY_LOW = "Low";
export const SEVERITY_MEDIUM = "Medium";
export const SEVERITY_HIGH = "High";
export const SEVERITY_CRITICAL = "Critical";

const WEIGHTS: Record<string, number> = {
    [SEVERITY_CRITICAL]: 40,
    [SEVERITY_HIGH]: 25,
    [SEVERITY_MEDIUM]: 12,
    [SEVERITY_LOW]: 5,
};

export const REVIEW_THRESHOLD = 50;

export function severityWeight(severity: string | undefined): number {
    if (severity == null) return 0;
    return WEIGHTS[severity] ?? 0;
}

export function cappedRisk(score: number): number {
    return Math.max(0, Math.min(100, score));
}

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

export function isActiveCase(status: string | undefined): boolean {
    return (
        status === STATUS_OPEN ||
        status === STATUS_IN_REVIEW ||
        status === STATUS_PENDING_CLOSE
    );
}
