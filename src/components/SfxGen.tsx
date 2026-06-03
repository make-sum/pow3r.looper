import React, { useState } from "react";
import { CloudFog, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { GoogleGenAI } from "@google/genai";
import { useGalleryStore } from "../services/galleryService";

export const SfxGen = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);

  const [scanRate, setScanRate] = useState(30);
  const [allocation, setAllocation] = useState(100);
  const [pumpIntensity, setPumpIntensity] = useState(45);
  const [fanSpeed, setFanSpeed] = useState(80);
  const [pattern, setPattern] = useState("LIQUID SKY");
  const [generatedPattern, setGeneratedPattern] = useState<string | null>(null);
  const globalBpm = useAppStore(state => state.globalBpm); 

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Firing SFX Sequences...", { description: "Synchronizing lasers and hazers" });
    
    try {
      const currentConfig = `Pattern: ${pattern}, ScanRate(kpps): ${scanRate}, Allocation: ${allocation}%, Haze Pump: ${pumpIntensity}%, Haze Fan: ${fanSpeed}%`;
      const aiResponse = await fetch("/api/generate-text", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
             prompt: `Given the laser and atmospherics config, generate a cool 3-word name for the ILDA laser pattern, then short technical geometric description of the laser shapes. Config: ${currentConfig}`,
             model: "gemini-2.5-flash"
         })
      });

      let textOutput = "BEAM ARRAY. Standard fan beams.";
      if (aiResponse.ok) {
         const data = await aiResponse.json();
         textOutput = data.text || textOutput;
      }
      setGeneratedPattern(textOutput);

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "SfxGen",
        config: { pattern, scanRate, allocation, pumpIntensity, fanSpeed, patternInfo: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `SFX array updated.`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      const configObj = { pattern, scanRate, allocation, pumpIntensity, fanSpeed, patternInfo: textOutput };

      useAppStore.getState().addSequenceBlock({
        id: `sfx_gen_${Date.now()}`,
        name: `Laser/Haze Trigger (${pattern})`,
        loopCount: 4,
        volume: 0,
        fx: [],
        metadata: configObj
      });
      addGalleryItem({
         title: `SFX Pattern (${scanRate}kpps)`,
         type: "sfx",
         url: `data:application/json;base64,${btoa(JSON.stringify(configObj))}`,
         format: "json",
         tags: ["laser", "ilda", "haze"],
         albums: [],
         metadata: configObj,
         sourcePageId: "sfx"
      });
      
      toast.success("SFX Fired", { description: "ILDA patterns linked and added to Global Gallery." });
    } catch (e: any) {
      toast.error("SFX Failed");
      useAppStore.getState().addSystemLog(`error: SFX sync failed: ${e.message || String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(CloudFog, { className: "w-4 h-4" })} SFX Gen (Laser)
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
        {JSON.stringify({ component: "SFX Gen (Laser)", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]">SFX & Laser Console</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Atmosphere and ILDA Laser Projection</p>
        </div>
        <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">LASER PROJECTOR CONFIG (ILDA)</div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>PATTERN</span>
                   <span className="text-red-400 font-mono">{pattern}</span>
                 </div>
                 <select value={pattern} onChange={e => setPattern(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer outline-none focus:border-red-500/50">
                   <option value="LIQUID SKY">LIQUID SKY</option>
                   <option value="CONE SWEEP">CONE SWEEP</option>
                   <option value="TUNNEL">TUNNEL</option>
                   <option value="AUDIO REACTIVE WAVES">AUDIO REACTIVE WAVES</option>
                 </select>
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>SCAN RATE</span>
                   <span className="text-red-400 font-mono">{scanRate}kpps</span>
                 </div>
                 <input type="range" className="w-full accent-red-500" min="10" max="60" value={scanRate} onChange={(e) => setScanRate(parseInt(e.target.value))} />
               </div>

               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>POWER ALLOCATION</span>
                   <span className="text-red-400 font-mono">{allocation}%</span>
                 </div>
                 <input type="range" className="w-full accent-red-500" min="0" max="100" value={allocation} onChange={(e) => setAllocation(parseInt(e.target.value))} />
               </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">ATMOSPHERICS (FOG / HAZE)</div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>PUMP INTENSITY (HAZER)</span>
                   <span className="text-zinc-300 font-mono">{pumpIntensity}%</span>
                 </div>
                 <input type="range" className="w-full accent-zinc-500" min="0" max="100" value={pumpIntensity} onChange={(e) => setPumpIntensity(parseInt(e.target.value))} />
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>FAN SPEED</span>
                   <span className="text-zinc-300 font-mono">{fanSpeed}%</span>
                 </div>
                 <input type="range" className="w-full accent-zinc-500" min="0" max="100" value={fanSpeed} onChange={(e) => setFanSpeed(parseInt(e.target.value))} />
               </div>
             </div>
             <button onClick={handleGenerate} disabled={isProcessing} className="w-full mt-6 bg-red-900/40 border border-red-500/50 hover:bg-red-800/60 text-red-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isProcessing ? "FIRING SEQUENCES..." : <><CloudFog className="w-4 h-4" /> TRIGGER SFX & LASERS</>}
             </button>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
           <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">SYNTHESIS VIEWPOINT</div>
           <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden">
               {/* Haze Background */}
               <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] mix-blend-screen transition-opacity ${(!isProcessing && generatedPattern) ? 'opacity-80' : ''}`} style={{ opacity: (!isProcessing && generatedPattern) ? (pumpIntensity / 100) * 0.8 : (isProcessing ? (pumpIntensity / 100) * 0.8 : 0.1), animation: (!isProcessing && generatedPattern) ? `pulse ${60 / globalBpm}s ease-in-out infinite` : 'none' }}></div>
               
               {/* Lasers base */}
               {(isProcessing || generatedPattern) && (
                 <>
                   <div className="absolute top-1/2 left-0 h-[2px] bg-red-500 shadow-[0_0_15px_#ef4444,0_0_30px_#ef4444] transform -translate-y-1/2 origin-left animate-spin" style={{ width: `${allocation}%`, animationDuration: `${60 / globalBpm}s` }}></div>
                   <div className="absolute top-1/2 left-0 h-[2px] bg-blue-500 shadow-[0_0_15px_#3b82f6,0_0_30px_#3b82f6] transform -translate-y-1/2 origin-left rotate-45 animate-spin" style={{ width: `${allocation}%`, animationDuration: `${(60 / globalBpm) * 1.5}s` }}></div>
                   <div className="absolute top-1/2 right-0 h-[2px] bg-green-500 shadow-[0_0_15px_#22c55e,0_0_30px_#22c55e] transform -translate-y-1/2 origin-right rotate-90 animate-spin" style={{ width: `${allocation}%`, animationDuration: `${(60 / globalBpm) / (scanRate / 20)}s` }}></div>
                 </>
               )}

               {!isProcessing && !generatedPattern && (
                  <div className="text-zinc-600 text-xs flex flex-col items-center gap-2 z-10 relative">
                     <CloudFog className="w-12 h-12 opacity-20" />
                     <span>System standing by</span>
                  </div>
               )}
               
               {!isProcessing && generatedPattern && (
                 <div className="absolute bottom-4 inset-x-4 bg-zinc-950/80 p-3 rounded border border-red-500/30 text-[10px] text-red-400 font-mono z-10">
                    <span className="font-bold border-b border-red-900/50 pb-1 mb-2 block">ILDA PATTERN GENERATED:</span>
                    {generatedPattern}
                 </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};
