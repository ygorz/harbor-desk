import { useEffect, useState } from "react";
import { NonIdealState, Spinner } from "@blueprintjs/core";
import { useNavigate } from "react-router-dom";
import { auth } from "./client";
import css from "./desk/desk.module.css";

/**
 * Component to render at `/auth/callback`
 * This calls signIn() again to save the token, and then navigates the user back to the home page.
 */
function AuthCallback(): React.ReactElement {
  const [error, setError] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // This effect conflicts with React 18 strict mode in development
  // https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development
  useEffect(() => {
    const signIn = (auth as { signIn?: () => Promise<unknown> }).signIn;
    if (typeof signIn !== "function") {
      navigate("/", { replace: true });
      return;
    }
    signIn()
      .then(() => navigate("/", { replace: true }))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : String(e)),
      );
  }, [navigate]);

  return (
    <div className={css.screen}>
      {error != null ? (
        <NonIdealState
          icon="error"
          title="Sign-in failed"
          description={error}
        />
      ) : (
        <NonIdealState
          icon={<Spinner />}
          title="Authenticating…"
          description="Returning to Harbor Desk."
        />
      )}
    </div>
  );
}

export default AuthCallback;
