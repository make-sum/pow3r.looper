import fs from "fs";
import path from "path";

const components = [
  { id: "node-builder-music-gen", file: "MusicGen.tsx", name: "Music Gen", icon: "Music" },
  { id: "node-builder-voice-gen", file: "VoiceGen.tsx", name: "Voice Gen", icon: "Mic" },
  { id: "node-builder-mixer", file: "Mixer.tsx", name: "Mixer", icon: "SlidersHorizontal" },
  { id: "node-builder-sequencer", file: "Sequencer.tsx", name: "Sequencer", icon: "Layers" },
  { id: "node-builder-loop-player", file: "LoopPlayer.tsx", name: "Loop Player", icon: "Play" },
  { id: "node-builder-image-gen", file: "ImageGen.tsx", name: "Image Gen", icon: "Image as ImageIcon" },
  { id: "node-builder-video-gen", file: "VideoGen.tsx", name: "Video Gen", icon: "Video" },
  { id: "node-builder-light-gen", file: "LightGen.tsx", name: "Light Gen", icon: "Lightbulb" },
  { id: "node-builder-sfx-gen", file: "SfxGen.tsx", name: "SFX Gen (Laser)", icon: "CloudFog" },
  { id: "node-builder-agent-gen", file: "AgentGen.tsx", name: "Agent Gen", icon: "Code" },
  { id: "node-builder-sampler-editor", file: "SamplerEditor.tsx", name: "Sampler Editor", icon: "Copy" },
  { id: "node-builder-dance-gen", file: "DanceGen.tsx", name: "Dance Gen", icon: "Activity" },
  { id: "node-builder-amca", file: "Amca.tsx", name: "AMCA", icon: "Activity" },
  { id: "node-builder-vmca", file: "Vmca.tsx", name: "VMCA", icon: "Radar" },
  { id: "node-builder-midi", file: "Midi.tsx", name: "MIDI Editor", icon: "Piano" },
  { id: "node-builder-spark-fingerprinting", file: "SparkFingerprinting.tsx", name: "Spark Fingerprint", icon: "Shield" },
  { id: "node-builder-projection-mapper", file: "ProjectionMapper.tsx", name: "Projection Map", icon: "Monitor" },
  { id: "node-builder-hologram", file: "Hologram.tsx", name: "Hologram Track", icon: "Ghost" },
  { id: "node-builder-ar-presets", file: "ArPresets.tsx", name: "AR Presets", icon: "Camera" },
  { id: "node-builder-mic-recorder", file: "MicRecorder.tsx", name: "Mic Recorder", icon: "Mic" },
  { id: "node-builder-surface-scanner", file: "SurfaceScanner.tsx", name: "Surface Scanner", icon: "ScanLine" },
  { id: "node-builder-video-tracking", file: "VideoTracking.tsx", name: "Video Tracking", icon: "User" }
];

const template = (comp) => `import React, { useState } from "react";
import { ${comp.icon}, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";

export const ${comp.file.replace('.tsx','')} = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const [isProcessing, setIsProcessing] = useState(false);

  const triggerMockWorkflow = async () => {
    setIsProcessing(true);
    const req = buildPow3rRequest("UPDATE_PARAMETER", { target: "${comp.file.replace('.tsx','')}", status: "initialized" });
    const res = await executePow3rWorkflow(req, async () => {
      // simulated pipeline processing
      await new Promise(r => setTimeout(r, 1500));
      return { msg: "Workflow Execution Completed for ${comp.name}" };
    });
    appendLogs(res);
    setIsProcessing(false);
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(${comp.icon.split(' as ')[1] || comp.icon}, { className: "w-4 h-4" })} ${comp.name}
        </div>
        <div className="text-[10px] text-indigo-300">Pow3r Component Generator Node</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-indigo-400 font-mono bg-zinc-950 p-4 border border-indigo-500/20 rounded">
        {JSON.stringify({ component: "${comp.name}", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center font-mono overflow-auto custom-scrollbar h-[600px] w-full p-6 relative">
       {React.createElement(${comp.icon.split(' as ')[1] || comp.icon}, { className: "w-16 h-16 text-indigo-400 mb-6 drop-shadow-[0_0_20px_#6366f1] animate-[pulse_3s_ease-in-out_infinite]" })}
       <div className="text-sm font-bold text-indigo-300 tracking-[0.2em] mb-4 z-10 text-center">${comp.name.toUpperCase()}</div>
       <div className="text-xs text-indigo-400/70 mb-4 max-w-sm text-center">
         Pow3r builder component for ${comp.name}. Wired to telemetry X-Bugger notifications and unified workflow.
       </div>
       <div className="w-full max-w-sm border border-indigo-500/30 bg-indigo-900/10 p-4 rounded text-[10px] text-indigo-300 flex flex-col gap-3">
         <div className="flex items-start gap-2 bg-zinc-950 p-3 rounded border border-zinc-800 text-amber-500">
           <AlertTriangle className="w-4 h-4 shrink-0" />
           <span className="leading-tight">Feature flagged or in dev phase. Firing a task triggers unified orchestrator fallback event.</span>
         </div>
         <button 
           onClick={triggerMockWorkflow}
           disabled={isProcessing}
           className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors mt-2"
         >
           {isProcessing ? (
             <span className="animate-pulse">PROCESSING WORKFLOW...</span>
           ) : (
             <>
               <Play className="w-4 h-4" /> 
               TRIGGER WORKFLOW EVENT
             </>
           )}
         </button>
       </div>
    </div>
  );
};
`;

components.forEach(comp => {
  fs.writeFileSync(path.join(process.cwd(), "src/components", comp.file), template(comp));
});

console.log("Generated components.");
