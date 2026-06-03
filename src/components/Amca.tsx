import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Activity, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { VolumetricDataVisualizer } from './visualizers/VolumetricDataVisualizer';

export const Amca = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const [isProcessing, setIsProcessing] = useState(false);

  const [reactivity, setReactivity] = useState(-12);
  const [smoothing, setSmoothing] = useState(20);
  const [generatedMotionRules, setGeneratedMotionRules] = useState<string | null>(null);
  const [activeBand, setActiveBand] = useState<"SUB"|"MID"|"HIGH">("SUB");

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Analyzing Audio Stream...", { description: "Establishing Pow3r AMCA signal flow" });
    
    try {
      const response = await proxyGenerateText(`Based on the parameters (Reactivity: ${reactivity}dB, Smoothing: ${smoothing}%, Band: ${activeBand}), generate 3 creative Audio-to-Motion mapping rules for a spatial rig. Keep it very punchy and short.`);

      const textOutput = response || "";
      setGeneratedMotionRules(textOutput);

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "Amca",
        config: { reactivity, smoothing, rules: textOutput, band: activeBand }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `AMCA Link established`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `amca_link_${Date.now()}`,
        name: `Audio-Motion Sync (${activeBand})`,
        loopCount: 16,
        volume: 0,
        fx: [],
        metadata: { reactivity, smoothing, rules: textOutput, band: activeBand }
      });
      
      toast.success("Link Active", { description: "Signal route bound to active channel." });
    } catch (e) {
      toast.error("Linking Failed");
      useAppStore.getState().addSystemLog(`error: AMCA sync failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Activity, { className: "w-4 h-4" })} AMCA
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
        {JSON.stringify({ component: "AMCA", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">AMCA System</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Audio Motion Control Agent</p>
        </div>
        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">AUDIO ANALYSIS MATRIX</div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>FREQUENCY BAND</span>
                   <span className="text-rose-400 font-mono">BASS / {activeBand}</span>
                 </div>
                 <div className="bg-zinc-950 p-2 border border-zinc-800 rounded flex gap-2">
                     <button onClick={() => setActiveBand("SUB")} className={`flex-1 text-[10px] py-1 rounded transition-colors ${activeBand === "SUB" ? "bg-rose-500/20 border border-rose-500 text-rose-300" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"}`}>SUB</button>
                     <button onClick={() => setActiveBand("MID")} className={`flex-1 text-[10px] py-1 rounded transition-colors ${activeBand === "MID" ? "bg-rose-500/20 border border-rose-500 text-rose-300" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"}`}>MID</button>
                     <button onClick={() => setActiveBand("HIGH")} className={`flex-1 text-[10px] py-1 rounded transition-colors ${activeBand === "HIGH" ? "bg-rose-500/20 border border-rose-500 text-rose-300" : "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"}`}>HIGH</button>
                 </div>
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>REACTIVITY THRESHOLD</span>
                   <span className="text-rose-400 font-mono">{reactivity}dB</span>
                 </div>
                 <input type="range" className="w-full accent-rose-500" min="-60" max="0" value={reactivity} onChange={(e) => setReactivity(parseInt(e.target.value))} />
               </div>

               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>SMOOTHING / ATTACK</span>
                   <span className="text-rose-400 font-mono">{smoothing}%</span>
                 </div>
                 <input type="range" className="w-full accent-rose-500" min="0" max="100" value={smoothing} onChange={(e) => setSmoothing(parseInt(e.target.value))} />
               </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">MOTION TARGET MAPPING</div>
             <div className="space-y-3">
                 {generatedMotionRules ? (
                    <div className="bg-rose-950/20 border border-rose-500/20 p-2 rounded text-[10px] text-zinc-300 font-mono whitespace-pre-wrap break-all">
                       <span className="text-rose-400 font-bold block mb-1">GENERATED MOTION RULES:</span>
                       {generatedMotionRules}
                    </div>
                 ) : (
                     <>
                         <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded px-3 py-2">
                             <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                                 <span className="text-[10px] text-zinc-300 font-bold">Target: PARTICLES_Z</span>
                             </div>
                             <span className="text-[9px] text-zinc-500">Amp &gt; Scale</span>
                         </div>
                         <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded px-3 py-2">
                             <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                                 <span className="text-[10px] text-zinc-300 font-bold">Target: LIGHT_RIG_DMX</span>
                             </div>
                             <span className="text-[9px] text-zinc-500">Freq &gt; Hue</span>
                         </div>
                     </>
                 )}
             </div>
             
             <button onClick={handleGenerate} disabled={isProcessing} className="w-full mt-6 bg-rose-900/40 border border-rose-500/50 hover:bg-rose-800/60 text-rose-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isProcessing ? "ANALYZING AUDIO STREAM..." : <><Activity className="w-4 h-4" /> START AUDIO-MOTION SYNC</>}
             </button>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
           <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">REAL-TIME DATA STREAM</div>
           <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative flex flex-col overflow-hidden p-4">
               
               <div className="flex-1 flex items-end gap-1 mb-4 border-b border-zinc-800 pb-2 overflow-hidden h-32 relative">
                   {isProcessing || generatedMotionRules ? (
                      Array.from({ length: 32 }).map((_, i) => (
                         <div 
                           key={i} 
                           className="flex-1 bg-rose-500 rounded-t transition-all duration-75"
                           style={{ 
                             height: `${(isProcessing ? (Math.random() * 100) : (Math.sin(i * 0.5) * 50 + 50)) * (100 - smoothing) / 100}%`,
                             opacity: isProcessing ? 0.8 : 0.5
                           }}
                         />
                      ))
                   ) : (
                      <span className="text-zinc-600 font-mono text-xs absolute bottom-2 left-0">Visualizer offline</span>
                   )}
               </div>
               
               <div className="h-40 bg-zinc-950 rounded border border-zinc-800 relative p-2 flex flex-col gap-2 overflow-hidden">
                   <div className="text-[10px] text-zinc-500 z-10 relative">GENERATED CONTROL CURVE</div>
                   <div className="absolute inset-0 z-0 opacity-50">
                       <VolumetricDataVisualizer isActive={isProcessing || !!generatedMotionRules} intensity={isProcessing ? 3.0 : 0.8} trackId={generatedMotionRules ? `amca_motion_${smoothing}_${reactivity}` : "amca_motion"} />
                   </div>
                   {isProcessing && (
                      <div className="absolute right-4 top-4 bg-rose-500/20 border border-rose-500 text-rose-400 text-[8px] px-2 py-1 rounded z-10">
                          SIGNAL OUTPUT OVERRIDE ACTIVE
                      </div>
                   )}
               </div>

           </div>
        </div>
      </div>
    </div>
  );
};
