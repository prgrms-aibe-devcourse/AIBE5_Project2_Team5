import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type NightModeContextValue = {
  isNight: boolean;
  toggle: () => void;
};

const NightModeContext = createContext<NightModeContextValue>({
  isNight: false,
  toggle: () => {},
});

export function NightModeProvider({ children }: { children: ReactNode }) {
  const [isNight, setIsNight] = useState(false);
  const toggle = useCallback(() => setIsNight((prev) => !prev), []);

  return (
    <NightModeContext.Provider value={{ isNight, toggle }}>
      {children}
    </NightModeContext.Provider>
  );
}

export function useNightMode() {
  return useContext(NightModeContext);
}
