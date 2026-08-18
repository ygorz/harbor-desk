import { describe, expect, it } from "vitest";
import { UserFacingError } from "@osdk/functions";
import {
    assertKnownSeverity,
    cappedRisk,
    isActiveCase,
    isFindingsFrozen,
    isKnownSeverity,
    REVIEW_THRESHOLD,
    SEVERITIES,
    severityWeight,
    STATUS_CLOSED,
    STATUS_IN_REVIEW,
    STATUS_OPEN,
    STATUS_PENDING_CLOSE,
    statusAfterRisk,
} from "./policy.js";

describe("severity allowlist", () => {
    it("lists Low Medium High Critical", () => {
        expect([...SEVERITIES]).toEqual(["Low", "Medium", "High", "Critical"]);
    });

    it("weights match the desk", () => {
        expect(severityWeight("Critical")).toBe(40);
        expect(severityWeight("High")).toBe(25);
        expect(severityWeight("Medium")).toBe(12);
        expect(severityWeight("Low")).toBe(5);
    });

    it("unknown severity is not known and weights 0", () => {
        expect(isKnownSeverity("Extreme")).toBe(false);
        expect(severityWeight("Extreme")).toBe(0);
        expect(severityWeight(undefined)).toBe(0);
    });

    it("assertKnownSeverity throws UserFacingError", () => {
        expect(() => assertKnownSeverity("Extreme")).toThrow(UserFacingError);
        expect(() => assertKnownSeverity("Extreme")).toThrow(
            "Severity must be Low, Medium, High, or Critical.",
        );
        expect(() => assertKnownSeverity("High")).not.toThrow();
    });
});

describe("cappedRisk", () => {
    it("clamps to 0–100", () => {
        expect(cappedRisk(-4)).toBe(0);
        expect(cappedRisk(65)).toBe(65);
        expect(cappedRisk(140)).toBe(100);
    });
});

describe("statusAfterRisk", () => {
    it("escalates Open to In review at the threshold", () => {
        expect(statusAfterRisk(STATUS_OPEN, REVIEW_THRESHOLD - 1)).toBe(
            STATUS_OPEN,
        );
        expect(statusAfterRisk(STATUS_OPEN, REVIEW_THRESHOLD)).toBe(
            STATUS_IN_REVIEW,
        );
    });

    it("does not de-escalate In review", () => {
        expect(statusAfterRisk(STATUS_IN_REVIEW, 0)).toBe(STATUS_IN_REVIEW);
    });

    it("leaves Pending close and Closed frozen", () => {
        expect(statusAfterRisk(STATUS_PENDING_CLOSE, 80)).toBe(
            STATUS_PENDING_CLOSE,
        );
        expect(statusAfterRisk(STATUS_CLOSED, 80)).toBe(STATUS_CLOSED);
    });
});

describe("case activity", () => {
    it("treats Pending close as active", () => {
        expect(isActiveCase(STATUS_OPEN)).toBe(true);
        expect(isActiveCase(STATUS_IN_REVIEW)).toBe(true);
        expect(isActiveCase(STATUS_PENDING_CLOSE)).toBe(true);
        expect(isActiveCase(STATUS_CLOSED)).toBe(false);
    });

    it("freezes findings on Pending close and Closed", () => {
        expect(isFindingsFrozen(STATUS_PENDING_CLOSE)).toBe(true);
        expect(isFindingsFrozen(STATUS_CLOSED)).toBe(true);
        expect(isFindingsFrozen(STATUS_OPEN)).toBe(false);
        expect(isFindingsFrozen(STATUS_IN_REVIEW)).toBe(false);
    });
});
