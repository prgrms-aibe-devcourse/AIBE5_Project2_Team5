import { useNightMode } from "../../contexts/NightModeContext";
import { getAuthSurface, type AuthSurface } from "./authSurface";

export function useAuthSurface(): AuthSurface & { isNight: boolean; toggle: () => void } {
  const { isNight, toggle } = useNightMode();
  return { isNight, toggle, ...getAuthSurface(isNight) };
}
