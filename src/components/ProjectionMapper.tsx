import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Monitor, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
export const ProjectionMapper = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const [isProcessing, setIsProcessing] = useState(false);

  const [edgeBlendLR, setEdgeBlendLR] = useState(15);
  const [edgeBlendTB, setEdgeBlendTB] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [selectedPreset, setSelectedPreset] = useState("STUDIO_RIG_A");
  const [generatedWarp, setGeneratedWarp] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Warping Output...", { description: `Applying ${selectedPreset} projection mapping matrix` });
    
    try {
      const currentConfig = `Preset: ${selectedPreset}, BlendLR: ${edgeBlendLR}, BlendTB: ${edgeBlendTB}, Bright: ${brightness}, Cont: ${contrast}`;
      const response = await proxyGenerateText(`Given the Projection mapping settings, output a JSON array of 4 corners (x, y) representing the warped coordinates for a 1920x1080 canvas. Settings: ${currentConfig}. No explanation, just brief JSON like [{x:0, y:0}, ...]`);

      const textOutput = response || "";
      setGeneratedWarp(textOutput);

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "ProjectionMapper",
        config: { preset: selectedPreset, edgeBlendLR, edgeBlendTB, brightness, contrast, matrix: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `${data.config.preset} matrix applied`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `proj_map_${Date.now()}`,
        name: `Map/Warp Preset`,
        loopCount: 16,
        volume: 0,
        fx: []
      });
      
      toast.success("Output Updated", { description: "Projection matrix sent to display." });
    } catch (e) {
      toast.error("Warp Failed");
      useAppStore.getState().addSystemLog(`error: Projection warp failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Monitor, { className: "w-4 h-4" })} Projection Map
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
        {JSON.stringify({ component: "Projection Map", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]">Projection Mapper</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Spatial Geometry Warping</p>
        </div>
        <div className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
           <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
               <span>OUTPUT CANVAS</span>
               <div className="flex gap-2">
                   <button className="text-[10px] bg-zinc-800 px-2 rounded hover:text-white">QUAD</button>
                   <button className="text-[10px] bg-zinc-950 px-2 rounded text-zinc-500">MESH</button>
                   <button className="text-[10px] bg-zinc-950 px-2 rounded text-zinc-500">MASK</button>
               </div>
           </div>
           
           <div className="flex-1 bg-zinc-950 rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden p-4 group">
               {/* Background Grid */}
               <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.2 }}></div>
               
               {/* Warped Quad representation */}
               <div className="relative w-full max-w-[300px] aspect-video border border-teal-500/50"
                    style={{
                        transform: isProcessing ? 'perspective(500px) rotateX(10deg) rotateY(-15deg)' : 'perspective(500px) rotateX(0deg) rotateY(0deg)',
                        transition: 'transform 0.5s ease-out'
                    }}>
                    
                    {/* Source Image / Test Pattern */}
                    {isProcessing ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-teal-900/40 border border-teal-400/50">
                            <Monitor className="w-12 h-12 text-teal-400 opacity-50" />
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMjBoNDBNMjAgMHY0MCIgc3Ryb2tlPSIjMmRkNGJmIiBzdHJva2Utb3BhY2l0eT0iMC4yIiBmaWxsPSJub25lIi8+PC9zdmc+')]"></div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-black flex items-center justify-center font-bold text-zinc-600 text-[10px] border border-zinc-800">
                            STANDBY TEST PATTERN
                        </div>
                    )}

                    {/* Corner Handles */}
                    <div className={`absolute -top-1.5 -left-1.5 w-3 h-3 bg-zinc-200 border border-black cursor-crosshair ${isProcessing ? 'translate-x-2 translate-y-4' : ''} transition-transform duration-500`}></div>
                    <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 bg-zinc-200 border border-black cursor-crosshair ${isProcessing ? '-translate-x-4 translate-y-2' : ''} transition-transform duration-500`}></div>
                    <div className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-zinc-200 border border-black cursor-crosshair ${isProcessing ? 'translate-x-1 -translate-y-2' : ''} transition-transform duration-500`}></div>
                    <div className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-zinc-200 border border-black cursor-crosshair`}></div>
               </div>
               
               <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[8px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span>RES: 1920x1080</span>
                   <span>BLEND: ADDITIVE</span>
                   <span>SNAP: ON</span>
               </div>
               {generatedWarp && !isProcessing && (
                   <div className="absolute top-2 left-2 right-2 bg-black/80 p-2 rounded text-[8px] text-teal-400 font-mono whitespace-pre-wrap border border-teal-500/30">
                       <span className="text-white">GENERATED MATRIX INFO:</span><br/>
                       {generatedWarp}
                   </div>
               )}
           </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">MAPPING CONFIG</div>
             
             <div className="space-y-4">
                 <div>
                     <div className="text-[10px] text-zinc-500 mb-1">PROJECTOR HARDWARE</div>
                     <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer">
                       <option>PROJECTOR A (HDMI 1)</option>
                       <option>PROJECTOR B (HDMI 2)</option>
                       <option>VIRTUAL DISPLAY OUT</option>
                     </select>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                       <div className="text-[10px] text-zinc-500 mb-1">EDGE BLENDING L/R</div>
                       <input type="range" className="w-full accent-teal-500" min="0" max="100" value={edgeBlendLR} onChange={(e) => setEdgeBlendLR(parseInt(e.target.value))} />
                     </div>
                     <div>
                       <div className="text-[10px] text-zinc-500 mb-1">EDGE BLENDING T/B</div>
                       <input type="range" className="w-full accent-teal-500" min="0" max="100" value={edgeBlendTB} onChange={(e) => setEdgeBlendTB(parseInt(e.target.value))} />
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div>
                       <div className="text-[10px] text-zinc-500 mb-1">BRIGHTNESS</div>
                       <input type="range" className="w-full accent-teal-500" min="0" max="100" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} />
                     </div>
                     <div>
                       <div className="text-[10px] text-zinc-500 mb-1">CONTRAST</div>
                       <input type="range" className="w-full accent-teal-500" min="0" max="100" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} />
                     </div>
                 </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col justify-between">
               <div>
                   <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">WARP ENGINE / PRESETS</div>
                   
                   <div className="mb-4">
                     <div className="text-[10px] text-zinc-500 mb-1">MAPPING PRESET</div>
                     <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer" value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
                       <option>STUDIO_RIG_A</option>
                       <option>OUTDOOR_BUILDING</option>
                       <option>DOME_PROJECTION</option>
                       <option>CUSTOM_USER_MAP</option>
                     </select>
                   </div>

                   <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                       <div className="bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-400 cursor-pointer hover:bg-zinc-800">RESET TRANSFORMS</div>
                       <div className="bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-400 cursor-pointer hover:bg-zinc-800">AUTO-CALIBRATE</div>
                       <div className="bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-400 cursor-pointer hover:bg-zinc-800">SAVE PRESET</div>
                       <div className="bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-400 cursor-pointer hover:bg-zinc-800">LOAD PRESET</div>
                   </div>
               </div>

               <button onClick={handleGenerate} disabled={isProcessing} className="w-full bg-teal-900/40 border border-teal-500/50 hover:bg-teal-800/60 text-teal-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4">
                  {isProcessing ? "WARPING OUTPUT..." : <><Monitor className="w-4 h-4" /> ENABLE FULLSCREEN OUTPUT</>}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};
