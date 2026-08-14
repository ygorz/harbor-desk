/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Osdk } from "@osdk/client";
import { analyst } from "@ontology/sdk";
import { MAYA_ID } from "./status";

const STORAGE_KEY = "harbor-desk.actingAs";

interface ActingAsValue {
  analystId: string;
  actingAs: Osdk.Instance<analyst> | undefined;
  setAnalystId: (id: string) => void;
}

const ActingAsContext = createContext<ActingAsValue | undefined>(undefined);

function readStoredId(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? MAYA_ID;
  } catch {
    return MAYA_ID;
  }
}

export function ActingAsProvider({
  analysts,
  children,
}: {
  analysts: Osdk.Instance<analyst>[];
  children: ReactNode;
}): ReactElement {
  const [analystId, setAnalystIdState] = useState(readStoredId);

  const setAnalystId = useCallback((id: string) => {
    setAnalystIdState(id);
    try {
      sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const actingAs = useMemo(() => {
    return (
      analysts.find((item) => item.id === analystId) ??
      analysts.find((item) => item.id === MAYA_ID) ??
      analysts[0]
    );
  }, [analystId, analysts]);

  const value = useMemo(
    () => ({
      analystId: actingAs?.id ?? analystId,
      actingAs,
      setAnalystId,
    }),
    [actingAs, analystId, setAnalystId],
  );

  return (
    <ActingAsContext.Provider value={value}>{children}</ActingAsContext.Provider>
  );
}

export function useActingAs(): ActingAsValue {
  const value = useContext(ActingAsContext);
  if (value == null) {
    throw new Error("useActingAs must be used inside ActingAsProvider");
  }
  return value;
}
