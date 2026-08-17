import { useState, type ReactElement } from "react";
import { Button, Dialog, DialogBody, DialogFooter } from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import {
  analyst,
  approveCloseAction,
  finding,
  investigationCase,
  requestCloseAction,
} from "@ontology/sdk";
import { useOsdkAction } from "@osdk/react";
import { useActingAs } from "./ActingAsContext";
import {
  errorMessage,
  FINDING_OPEN,
  STATUS_CLOSED,
  STATUS_PENDING_CLOSE,
} from "./status";
import { showError } from "./toast";
import css from "./desk.module.css";

export default function ClosePath({
  item,
  findings,
  analysts,
}: {
  item: Osdk.Instance<investigationCase>;
  findings: Osdk.Instance<finding>[];
  analysts: Osdk.Instance<analyst>[];
}): ReactElement {
  const { actingAs } = useActingAs();
  const requestAction = useOsdkAction(requestCloseAction);
  const approveAction = useOsdkAction(approveCloseAction);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const closed = item.status === STATUS_CLOSED;
  const pending = item.status === STATUS_PENDING_CLOSE;
  const risk = item.riskScore ?? 0;
  const openCount = findings.filter((row) => row.status === FINDING_OPEN).length;
  const actorId = actingAs?.id ?? String(actingAs?.$primaryKey ?? "");
  const requesterId = item.closeRequestedById ?? "";
  const isRequester = requesterId !== "" && requesterId === actorId;
  const secondAnalyst = analysts.find((row) => {
    const id = String(row.id ?? row.$primaryKey);
    return id !== requesterId;
  });

  async function run(work: () => Promise<unknown>): Promise<void> {
    if (actingAs == null) {
      showError("Select an analyst first.");
      return;
    }
    try {
      await work();
    } catch (caught) {
      showError(errorMessage(caught));
    }
  }

  async function approve(): Promise<void> {
    setConfirmOpen(false);
    await run(() =>
      approveAction.applyAction({
        caseToClose: item,
        actingAnalyst: actingAs!,
      }),
    );
  }

  const canRequest =
    actingAs != null && !closed && !pending && risk === 0;
  const canApprove = actingAs != null && pending && !isRequester;

  let requestHint: string;
  if (closed) requestHint = "Case is closed.";
  else if (pending) requestHint = "Waiting for four-eyes.";
  else if (risk > 0) requestHint = "Resolve every open finding first.";
  else requestHint = "Ready to request close.";

  let approveHint: string;
  if (closed) approveHint = "Already closed.";
  else if (!pending) approveHint = "Request close first.";
  else if (isRequester) {
    approveHint =
      secondAnalyst?.name != null
        ? `Switch to ${secondAnalyst.name} to approve.`
        : "A second analyst has to approve this close.";
  } else approveHint = "Independent review of this close.";

  return (
    <>
      <ol className={css.closePath} aria-label="Close path">
        <li className={css.closeStep}>
          <span className={css.closeStepLabel}>1 · Resolve findings</span>
          <div className={css.closeStepBody}>
            {openCount === 0 ? (
              <span>Findings clear</span>
            ) : (
              <span>
                {openCount} open
              </span>
            )}
          </div>
          <p className={css.closeStepHint}>
            {openCount === 0
              ? "Every finding is mitigated."
              : "Mitigate open findings to drop risk to 0."}
          </p>
        </li>
        <li className={css.closeStep}>
          <span className={css.closeStepLabel}>2 · Request close</span>
          <div className={css.closeStepBody}>
            <Button
              intent="warning"
              icon="log-out"
              loading={requestAction.isPending}
              disabled={!canRequest}
              onClick={() =>
                void run(() =>
                  requestAction.applyAction({
                    caseToClose: item,
                    actingAnalyst: actingAs!,
                  }),
                )
              }
            >
              Request Close
            </Button>
          </div>
          <p className={css.closeStepHint}>{requestHint}</p>
        </li>
        <li className={css.closeStep}>
          <span className={css.closeStepLabel}>3 · Four-eyes approve</span>
          <div className={css.closeStepBody}>
            <Button
              intent="success"
              icon="confirm"
              loading={approveAction.isPending}
              disabled={!canApprove}
              onClick={() => setConfirmOpen(true)}
            >
              Approve Close
            </Button>
          </div>
          <p className={css.closeStepHint}>{approveHint}</p>
        </li>
      </ol>
      <Dialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Approve Close"
      >
        <DialogBody>
          <p>
            Closing {item.title ?? item.id} cannot be undone from this desk.
            Confirm independent review.
          </p>
        </DialogBody>
        <DialogFooter
          actions={
            <>
              <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                intent="success"
                loading={approveAction.isPending}
                onClick={() => void approve()}
              >
                Approve Close
              </Button>
            </>
          }
        />
      </Dialog>
    </>
  );
}
