/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactFlowProvider } from "@xyflow/react";
import UnifiedCanvas from "./components/UnifiedCanvas";
import SurfaceView from "./components/SurfaceView";
import ModeIndicator from "./components/ModeIndicator";
import SharedPow3rControls from "./components/SharedPow3rControls";
import { useWorkflowStore } from "./store/useWorkflowStore";
import { useAppStore } from "./store/appStore";
import { GlobalMediaEngine } from "./components/GlobalMediaEngine";
import { Toaster } from "sonner";
/* pow3r-config-ui-binding */
import { useConfig, config_controls, configControls, componentConfig } from './config/pow3rConfig';
// Agent Note: Unbound UI — stamp config_controls.base_url on the document for this surface.
if (typeof document !== 'undefined' && config_controls && typeof config_controls === 'object' && 'base_url' in config_controls) {
  document.documentElement.dataset.pow3rConfigBase = String((config_controls as { base_url?: string }).base_url || '');
}
void useConfig;
void componentConfig;
void configControls;

const USE_SHARED_POW3R_CONTROLS =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('view') === 'pow3r-controls';

// --- TELEMETRY / X-BUGGER INTEGRATION ---
if (typeof window !== "undefined" && !(window as any)._telemetryAttached) {
  (window as any)._telemetryAttached = true;
  (window as any).__pow3rConfig = {
    base_url: configControls.base_url,
    pages: componentConfig.pages,
  };
  
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
  void viewMode;

  if (USE_SHARED_POW3R_CONTROLS) {
    return (
      <>
        <SharedPow3rControls />
        <Toaster theme="dark" position="bottom-right" />
      </>
    );
  }

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

