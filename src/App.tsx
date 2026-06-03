/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactFlowProvider } from "@xyflow/react";
import UnifiedCanvas from "./components/UnifiedCanvas";
import SurfaceView from "./components/SurfaceView";
import ModeIndicator from "./components/ModeIndicator";
import { useWorkflowStore } from "./store/useWorkflowStore";
import { useAppStore } from "./store/appStore";
import { GlobalMediaEngine } from "./components/GlobalMediaEngine";
import { Toaster } from "sonner";

// --- TELEMETRY / X-BUGGER INTEGRATION ---
if (typeof window !== "undefined" && !(window as any)._telemetryAttached) {
  (window as any)._telemetryAttached = true;
  
  window.addEventListener("error", (e) => {
    useAppStore.getState().addSystemLog(`window.error: ${e.message}`, "error");
  });
  
  window.addEventListener("unhandledrejection", (e) => {
    useAppStore.getState().addSystemLog(`unhandledrejection: ${e.reason}`, "error");
  });
}
// -----------------------------------------

const AppContent = () => {
  const viewMode = useWorkflowStore((state) => state.viewMode);

  return (
    <>
      <ModeIndicator />
      <div className="flex-1 h-full relative z-10">
        <SurfaceView />
      </div>
      <GlobalMediaEngine />
      <Toaster theme="dark" position="bottom-right" />
    </>
  );
};

export default function App() {
  return (
    <div className="w-screen h-screen flex bg-zinc-950 overflow-hidden relative">
      <ReactFlowProvider>
        <AppContent />
      </ReactFlowProvider>
    </div>
  );
}

