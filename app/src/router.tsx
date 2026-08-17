/* eslint-disable react-refresh/only-export-components */
import {
  createBrowserRouter,
  isRouteErrorResponse,
  useRouteError,
} from "react-router-dom";
import { NonIdealState } from "@blueprintjs/core";
import AuthCallback from "./AuthCallback";
import AppShell from "./desk/AppShell";
import CasePage from "./desk/CasePage";
import QueueHome from "./desk/QueueHome";
import css from "./desk/desk.module.css";

function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className={css.screen}>
        <NonIdealState
          icon="error"
          title={`${error.status} ${error.statusText}`}
          description={
            typeof error.data === "string" ? error.data : "This page could not be loaded."
          }
        />
      </div>
    );
  }

  return (
    <div className={css.screen}>
      <NonIdealState
        icon="error"
        title="Something went wrong"
        description={
          error instanceof Error
            ? error.message
            : "An unexpected error occurred."
        }
      />
    </div>
  );
}

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppShell />,
      errorElement: <ErrorPage />,
      children: [
        { index: true, element: <QueueHome /> },
        { path: "cases/:caseId", element: <CasePage /> },
      ],
    },
    {
      path: "/auth/callback",
      element: <AuthCallback />,
      errorElement: <ErrorPage />,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
