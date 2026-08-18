import {
  OverlayToaster,
  Position,
  type ToastProps,
  type Toaster,
} from "@blueprintjs/core";

let toasterPromise: Promise<Toaster> | undefined;

function liveRegion(): HTMLElement {
  let node = document.getElementById("hd-toast-live");
  if (node == null) {
    node = document.createElement("div");
    node.id = "hd-toast-live";
    node.setAttribute("aria-live", "polite");
    node.setAttribute("aria-atomic", "true");
    node.className = "hd-live";
    document.body.appendChild(node);
  }
  return node;
}

function getToaster(): Promise<Toaster> {
  toasterPromise ??= OverlayToaster.create({
    maxToasts: 3,
    position: Position.TOP,
  });
  return toasterPromise;
}

export function showToast(props: ToastProps): void {
  if (typeof props.message === "string") {
    liveRegion().textContent = props.message;
  }
  void getToaster().then((toaster) => toaster.show(props));
}

export function showError(message: string): void {
  showToast({
    icon: "warning-sign",
    intent: "warning",
    message,
    timeout: 8000,
  });
}

export function showSuccess(message: string): void {
  showToast({
    icon: "tick",
    intent: "success",
    message,
    timeout: 2500,
  });
}

export function showCopied(): void {
  showToast({
    icon: "tick",
    intent: "success",
    message: "Copied",
    timeout: 1500,
  });
}
