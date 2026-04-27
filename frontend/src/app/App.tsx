import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { NightModeProvider } from "./contexts/NightModeContext";
import { SmoothScrollProvider } from "./components/SmoothScrollProvider";

export default function App() {
  return (
    <NightModeProvider>
      <SmoothScrollProvider>
        <RouterProvider router={router} />
      </SmoothScrollProvider>
      <Toaster position="top-center" richColors />
    </NightModeProvider>
  );
}