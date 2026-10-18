import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "sonner";
import type { Theme } from "@/hooks/use-theme";
import { toastHost } from "@/lib/toast-host";

/** The app's single notification area; follows into an open modal so notifications stay visible above it. */
const AppToaster = ({ theme }: { theme: Theme }) => {
  const host = useSyncExternalStore(toastHost.subscribe, toastHost.get);
  return createPortal(<Toaster theme={theme} position="bottom-right" richColors closeButton />, host ?? document.body);
};

export default AppToaster;
