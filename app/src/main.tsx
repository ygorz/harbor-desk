/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { FocusStyleManager, OverlaysProvider } from "@blueprintjs/core";
import { OsdkProvider, useRegisterUserAgent } from "@osdk/react";
import client from "./client";
import "./index.css";
import { router } from "./router";

FocusStyleManager.onlyShowFocusOnTabs();
document.documentElement.classList.add("bp6-dark");

function UserAgentRegistrar(): null {
  useRegisterUserAgent("harbor-desk/0.1.0");
  return null;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OsdkProvider client={client} devMode={{ actionDelayMs: 0 }}>
      <OverlaysProvider>
        <UserAgentRegistrar />
        <RouterProvider router={router} />
      </OverlaysProvider>
    </OsdkProvider>
  </StrictMode>,
);
