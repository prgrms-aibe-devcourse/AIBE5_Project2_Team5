import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { NightModeProvider } from "./contexts/NightModeContext";

export default function App() {
  return (
    <NightModeProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </NightModeProvider>
  );
}