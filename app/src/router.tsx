/* eslint-disable react-refresh/only-export-components */
import {
  createBrowserRouter,
  isRouteErrorResponse,
  useRouteError,
} from "react-router-dom";
import AuthCallback from "./AuthCallback";
import AppShell from "./desk/AppShell";
import CasePage from "./desk/CasePage";
import QueueHome from "./desk/QueueHome";

function ErrorPage() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>
          {error.status} {error.statusText}
        </h1>
        {error.data && <p>{error.data}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>Something went wrong</h1>
      <p>
        {error instanceof Error
          ? error.message
          : "An unexpected error occurred."}
      </p>
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
