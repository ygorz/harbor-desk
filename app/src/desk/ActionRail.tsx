import type { ReactElement } from "react";
import { Button } from "@blueprintjs/core";
import type { Osdk } from "@osdk/client";
import {
  approveCloseAction,
  investigationCase,
  requestCloseAction,
} from "@ontology/sdk";
import { useOsdkAction } from "@osdk/react";
import { useActingAs } from "./ActingAsContext";
import { errorMessage, STATUS_CLOSED, STATUS_PENDING_CLOSE } from "./status";
import css from "./desk.module.css";

export default function ActionRail({
  item,
  onError,
}: {
  item: Osdk.Instance<investigationCase>;
  onError: (message: string | undefined) => void;
}): ReactElement {
  const { actingAs } = useActingAs();
  const requestAction = useOsdkAction(requestCloseAction);
  const approveAction = useOsdkAction(approveCloseAction);

  const closed = item.status === STATUS_CLOSED;
  const pending = item.status === STATUS_PENDING_CLOSE;

  async function run(
    work: () => Promise<unknown>,
  ): Promise<void> {
    if (actingAs == null) {
      onError("Select an analyst first.");
      return;
    }
    onError(undefined);
    try {
      await work();
    } catch (caught) {
      onError(errorMessage(caught));
    }
  }

  return (
    <div className={css.row}>
      <Button
        intent="warning"
        icon="log-out"
        loading={requestAction.isPending}
        disabled={actingAs == null || closed || pending}
        onClick={() =>
          void run(() =>
            requestAction.applyAction({
              caseToClose: item,
              actingAnalyst: actingAs!,
            }),
          )
        }
      >
        Request close
      </Button>
      <Button
        intent="success"
        icon="confirm"
        loading={approveAction.isPending}
        disabled={actingAs == null || !pending}
        onClick={() =>
          void run(() =>
            approveAction.applyAction({
              caseToClose: item,
              actingAnalyst: actingAs!,
            }),
          )
        }
      >
        Approve close
      </Button>
    </div>
  );
}
