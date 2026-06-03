import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Radar, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { VectorMatrix } from './visualizers/VectorMatrix';
export const Vmca = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const [isProcessing, setIsProcessing] = useState(false);

  const [sensitivity, setSensitivity] = useState(65);
  const [resolution, setResolution] = useState(16);
  const [generatedMotionAnalysis, setGeneratedMotionAnalysis] = useState<string | null>(null);


  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Processing Frame Buffer...", { description: "Establishing Pow3r VMCA signal flow" });
    
    try {
      const currentConfig = `Sensitivity: ${sensitivity}, Res: ${resolution}x${resolution}`;
      const response = await proxyGenerateText(`Generate a brief computer-vision style JSON analysis payload that detects a primary vector of motion. Config: ${currentConfig}. No markdown, just a JSON object.`);

      const textOutput = response || '{"motion":"none"}';
      setGeneratedMotionAnalysis(textOutput);

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "Vmca",
        config: { sensitivity, resolution, cvData: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `VMCA Link established`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `vmca_link_${Date.now()}`,
        name: `Video-Motion Sync (Res: ${resolution}px)`,
        loopCount: 16,
        volume: 0,
        fx: [],
        metadata: { sensitivity, resolution, analysis: textOutput }
      });
      
      toast.success("Link Active", { description: "Signal route bound to active channel." });
    } catch (e) {
      toast.error("Linking Failed");
      useAppStore.getState().addSystemLog(`error: VMCA sync failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Radar, { className: "w-4 h-4" })} VMCA
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
        {JSON.stringify({ component: "VMCA", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]">VMCA System</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Video Motion Control Agent</p>
        </div>
        <div className="px-3 py-1 bg-violet-500/10 border border-violet-500/30 text-violet-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">SPATIAL TRACKING CONFIG</div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>ALGORITHM</span>
                   <span className="text-violet-400 font-mono">OPTICAL FLOW</span>
                 </div>
                 <div className="bg-zinc-950 p-2 border border-zinc-800 rounded flex flex-col gap-2">
                     <button className="w-full bg-violet-500/20 border border-violet-500 text-violet-300 text-[10px] py-1 rounded">DENSE OPTICAL FLOW (Farneback)</button>
                     <button className="w-full bg-zinc-800 text-zinc-500 text-[10px] py-1 rounded hover:bg-zinc-700">SPARSE FEATURE TRACKING (Lucas-Kanade)</button>
                 </div>
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>MOTION SENSITIVITY</span>
                   <span className="text-violet-400 font-mono">{sensitivity}%</span>
                 </div>
                 <input type="range" className="w-full accent-violet-500" min="0" max="100" value={sensitivity} onChange={(e) => setSensitivity(parseInt(e.target.value))} />
               </div>

               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>GRID RESOLUTION</span>
                   <span className="text-violet-400 font-mono">{resolution}x{resolution}</span>
                 </div>
                 <input type="range" className="w-full accent-violet-500" min="4" max="64" step="4" value={resolution} onChange={(e) => setResolution(parseInt(e.target.value))} />
               </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">DATA ROUTING</div>
             <div className="space-y-3">
                 <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded px-3 py-2">
                     <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                         <span className="text-[10px] text-zinc-300 font-bold">Target: SYNTH_CUTOFF</span>
                     </div>
                     <span className="text-[9px] text-zinc-500">Vector Mag &gt; Val</span>
                 </div>
                 <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded px-3 py-2">
                     <div className="flex items-center gap-2">
                         <div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
                         <span className="text-[10px] text-zinc-500 font-bold">Target: PARTICLE_WIND_X</span>
                     </div>
                     <span className="text-[9px] text-zinc-600">Avg X Dir &gt; Val</span>
                 </div>
             </div>
             
             <button onClick={handleGenerate} disabled={isProcessing} className="w-full mt-6 bg-violet-900/40 border border-violet-500/50 hover:bg-violet-800/60 text-violet-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isProcessing ? "PROCESSING FRAME BUFFER..." : <><Radar className="w-4 h-4" /> INITIATE SPATIAL ANALYSIS</>}
             </button>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
           <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">VECTOR FIELD PREVIEW</div>
           <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden p-4">
               
               {/* Vector Field Grid */}
               <VectorMatrix isActive={isProcessing} color="139, 92, 246" speed={sensitivity / 30.0} complexity={resolution / 8.0} seed={sensitivity} />
               
               {/* Overlay Data */}
               {isProcessing ? (
                   <div className="absolute bottom-4 left-4 flex flex-col gap-1 z-10">
                       <div className="bg-violet-900/40 border border-violet-500 text-violet-300 text-[8px] px-2 py-1 rounded font-mono">
                           AVG MAGNITUDE: {(4.2).toFixed(2)}
                       </div>
                       <div className="bg-violet-900/40 border border-violet-500 text-violet-300 text-[8px] px-2 py-1 rounded font-mono">
                           DOMINANT DIR: {134}°
                       </div>
                   </div>
               ) : generatedMotionAnalysis ? (
                 <div className="absolute inset-0 bg-blue-900/40 p-4 border border-blue-500/20 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="text-[10px] text-blue-300 font-mono whitespace-pre-wrap break-all w-full leading-tight">
                       <span className="text-white font-bold mb-2 block">VMCA INFERENCE:</span>
                       {generatedMotionAnalysis}
                    </div>
                 </div>
               ) : null}
               
               {/* Circular Radar Sweep */}
               {isProcessing && (
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                       <div className="w-[120%] aspect-square rounded-full border border-violet-500 animate-[ping_4s_linear_infinite]"></div>
                   </div>
               )}

           </div>
        </div>
      </div>
    </div>
  );
};
