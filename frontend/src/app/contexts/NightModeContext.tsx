import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "pickxel-night-mode";

function readStoredNight(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

function persistNight(isNight: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, isNight ? "1" : "0");
  } catch {
    /* private mode / quota */
  }
}

type NightModeContextValue = {
  isNight: boolean;
  toggle: () => void;
};

const NightModeContext = createContext<NightModeContextValue>({
  isNight: false,
  toggle: () => {},
});

export function NightModeProvider({ children }: { children: ReactNode }) {
  const [isNight, setIsNight] = useState(readStoredNight);

  const toggle = useCallback(() => {
    setIsNight((prev) => !prev);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-night", String(isNight));
    persistNight(isNight);
  }, [isNight]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || e.storageArea !== localStorage) return;
      if (e.newValue === null) {
        setIsNight(false);
        return;
      }
      setIsNight(e.newValue === "1" || e.newValue === "true");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <NightModeContext.Provider value={{ isNight, toggle }}>
      {children}
    </NightModeContext.Provider>
  );
}

export function useNightMode() {
  return useContext(NightModeContext);
}
