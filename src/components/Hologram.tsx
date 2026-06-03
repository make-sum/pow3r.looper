import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Ghost, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { EnergyParticles } from './visualizers/EnergyParticles';
import { toast } from "sonner";
export const Hologram = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const [isProcessing, setIsProcessing] = useState(false);

  const [intensity, setIntensity] = useState(80);
  const [scatter, setScatter] = useState(15);
  const [layers, setLayers] = useState(3);
  const [generatedCloud, setGeneratedCloud] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Transmitting Volumetrics...", { description: "Engaging Pow3r Emitters" });
    
    try {
      const currentConfig = `Intensity: ${intensity}, Scatter: ${scatter}, Layers: ${layers}`;
      const response = await proxyGenerateText(`Given the Hologram settings, generate a realistic-looking volumetric point cloud metric log (3 lines). Config: ${currentConfig}`);

      const textOutput = response || "Voxel mapping complete.";
      setGeneratedCloud(textOutput);

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "Hologram",
        config: { intensity, scatter, layers, cloudData: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Volumetrics Engaged`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `holo_emit_${Date.now()}`,
        name: `Hologram Volumetrics`,
        loopCount: 4,
        volume: 0,
        fx: [],
        metadata: { intensity, scatter, layers, cloudData: textOutput }
      });
      
      toast.success("Emitters Active", { description: "Holographic projection live." });
    } catch (e) {
      toast.error("Transmission Failed");
      useAppStore.getState().addSystemLog(`error: Volumetric transmission failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Ghost, { className: "w-4 h-4" })} Hologram Track
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
        {JSON.stringify({ component: "Hologram Track", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">Volumetric Emitter</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Holographic Projection Matrix</p>
        </div>
        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
           <div className="text-xs text-zinc-400 font-bold mb-4 border-b border-zinc-800 pb-2">PROJECTION TANK</div>
           
           <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden p-4">
               {/* 3D Wireframe Box */}
               <div className="relative w-48 h-48 border border-zinc-800 transform rotate-45 skew-x-12 opacity-50">
                    <div className="absolute inset-0 border border-zinc-800 transform translate-x-4 -translate-y-4"></div>
               </div>
               
               {/* Emitter Beams */}
               {isProcessing && (
                 <>
                   <div className="absolute bottom-0 left-1/4 w-0 h-0 border-l-[2px] border-r-[2px] border-b-[200px] border-l-transparent border-r-transparent border-b-cyan-500/10 blur-sm"></div>
                   <div className="absolute bottom-0 right-1/4 w-0 h-0 border-l-[2px] border-r-[2px] border-b-[200px] border-l-transparent border-r-transparent border-b-cyan-500/10 blur-sm"></div>
                 </>
               )}

               {/* Hologram Representation */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {isProcessing ? (
                      <div className="relative flex items-center justify-center">
                          <Ghost className="w-24 h-24 text-cyan-300 drop-shadow-[0_0_15px_#22d3ee] animate-pulse" />
                          
                          {/* Glitch lines */}
                          <div className="absolute top-1/4 w-full h-[1px] bg-cyan-200 shadow-[0_0_5px_#fff] mix-blend-overlay animate-[ping_1s_linear_infinite]"></div>
                          <div className="absolute bottom-1/3 w-full h-[2px] bg-cyan-100 shadow-[0_0_5px_#fff] mix-blend-overlay animate-[pulse_2s_linear_infinite]"></div>
                          
                          {/* Particles */}
                          <EnergyParticles isActive={isProcessing} color="34, 211, 238" intensity={intensity} scatter={scatter} layers={layers} />
                      </div>
                  ) : generatedCloud ? (
                      <div className="bg-black/80 font-mono text-cyan-400 text-[10px] p-2 rounded whitespace-pre-wrap text-center opacity-80 border border-cyan-500/50">
                          {generatedCloud}
                      </div>
                  ) : (
                      <div className="text-zinc-500 text-[10px] flex flex-col items-center gap-2">
                         <div className="w-16 h-1 bg-zinc-800 rounded-full shadow-[0_0_10px_#27272a]"></div>
                         NO SIGNAL
                      </div>
                  )}
               </div>
           </div>
           
           <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]">
               <div className="bg-zinc-950 border border-zinc-800 p-2 rounded flex justify-between">
                   <span className="text-zinc-500">VOXEL GRID</span>
                   <span className="text-cyan-400">1024³</span>
               </div>
               <div className="bg-zinc-950 border border-zinc-800 p-2 rounded flex justify-between">
                   <span className="text-zinc-500">REFRESH</span>
                   <span className="text-cyan-400">120Hz</span>
               </div>
           </div>
        </div>
        
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">EMITTER SETTINGS</div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>DATA SOURCE</span>
                   <span className="text-cyan-400 font-mono">LIVE FEED C</span>
                 </div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer">
                   <option>Pre-Rendered Asset (OBJ/GLTF)</option>
                   <option>Live Mocap Stream (VMCA)</option>
                   <option>Point Cloud Stream (Lidar)</option>
                   <option>AI Generative Volume</option>
                 </select>
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>LUMINANCE INTENSITY</span>
                   <span className="text-cyan-400 font-mono">{intensity}%</span>
                 </div>
                 <input type="range" className="w-full accent-cyan-500" min="0" max="100" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))} />
               </div>

               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>GLITCH FACTOR (ARTIFACTS)</span>
                   <span className="text-cyan-400 font-mono">{scatter > 60 ? 'HI' : scatter > 30 ? 'MED' : 'LO'}</span>
                 </div>
                 <input type="range" className="w-full accent-cyan-500" min="0" max="100" value={scatter} onChange={(e) => setScatter(parseInt(e.target.value))} />
               </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">SPATIAL TRANSFORMS</div>
             <div className="grid grid-cols-3 gap-2">
                 <div className="bg-zinc-950 border border-zinc-800 rounded p-2 text-center">
                     <div className="text-[10px] text-zinc-500 mb-1">X-AXIS</div>
                     <div className="text-zinc-300 text-xs">0.0</div>
                 </div>
                 <div className="bg-zinc-950 border border-zinc-800 rounded p-2 text-center">
                     <div className="text-[10px] text-zinc-500 mb-1">Y-AXIS</div>
                     <div className="text-zinc-300 text-xs">15.2</div>
                 </div>
                 <div className="bg-zinc-950 border border-zinc-800 rounded p-2 text-center">
                     <div className="text-[10px] text-zinc-500 mb-1">Z-AXIS</div>
                     <div className="text-zinc-300 text-xs">-5.0</div>
                 </div>
             </div>
             <div className="flex justify-between text-[10px] text-zinc-500 mt-4 mb-1">
                 <span>SCALE MULTIPLIER</span>
                 <span className="text-zinc-300">{(layers / 2).toFixed(1)}x</span>
             </div>
             <input type="range" className="w-full accent-zinc-500" min="1" max="10" value={layers} onChange={(e) => setLayers(parseInt(e.target.value))} />
             
             <button onClick={handleGenerate} disabled={isProcessing} className="w-full mt-6 bg-cyan-900/40 border border-cyan-500/50 hover:bg-cyan-800/60 text-cyan-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isProcessing ? "TRANSMITTING VOLUMETRICS..." : <><Play className="w-4 h-4 fill-cyan-200" /> ENGAGE EMITTERS</>}
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};
