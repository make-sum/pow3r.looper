import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { ScanLine, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { VolumetricDataVisualizer } from './visualizers/VolumetricDataVisualizer';
export const SurfaceScanner = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const [isProcessing, setIsProcessing] = useState(false);

  const [accuracy, setAccuracy] = useState(5);
  const [density, setDensity] = useState(30);
  const [sensor, setSensor] = useState("TrueDepth (Front)");
  const [generateMesh, setGenerateMesh] = useState(true);
  const [exportFormat, setExportFormat] = useState("OBJ FORMAT");
  const [generatedCloudData, setGeneratedCloudData] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Acquiring Topography...", { description: "Running Pow3r Scanning Workflow" });
    
    try {
      const currentConfig = `Sensor: ${sensor}, Density: ${density}, Accuracy: ${accuracy}, Mesh: ${generateMesh}, Format: ${exportFormat}`;
      const response = await proxyGenerateText(`Generate a sample string of 3 Lidar point cloud coordinates (representing a triangle). Config: ${currentConfig}. Format: (x,y,z, r,g,b).`);

      const textOutput = response || "(0,0,0, 255,255,255)";
      setGeneratedCloudData(textOutput);

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "SurfaceScanner",
        config: { accuracy, density, sensor, generateMesh, exportFormat, cloudData: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Surface data acquired`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `surface_scan_${Date.now()}`,
        name: `LIDAR Topography`,
        loopCount: 16,
        volume: 0,
        fx: []
      });
      
      toast.success("Scan Complete", { description: "Topography stored in graph." });
    } catch (e) {
      toast.error("Scan Failed");
      useAppStore.getState().addSystemLog(`error: Surface scanning failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(ScanLine, { className: "w-4 h-4" })} Surface Scanner
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
        {JSON.stringify({ component: "Surface Scanner", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">LIDAR Mapper</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Spatial Geometry Acquisition</p>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded animate-pulse">
          SENSOR: ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 flex-1 min-h-0">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full relative overflow-hidden">
             {/* 3D Point Cloud View */}
             <div className="absolute inset-4 bg-black rounded-lg border border-zinc-800 overflow-hidden flex items-center justify-center">
                 {/* Grid Floor */}
                 <div className="absolute bottom-0 w-[200%] h-64 border-t border-emerald-900/30" style={{ transform: 'perspective(500px) rotateX(70deg)', backgroundImage: 'linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                 
                 {isProcessing || generatedCloudData ? (
                     <div className="relative w-full h-full flex items-center justify-center">
                        <VolumetricDataVisualizer isActive={isProcessing} intensity={isProcessing ? 3.0 : 0.8} trackId="surface_dmx" />
                        
                        {/* Scanning Laser */}
                        {isProcessing && <div className="absolute top-0 bottom-0 w-[1px] bg-emerald-300 shadow-[0_0_15px_#34d399] animate-[progress_3s_linear_infinite] z-20"></div>}
                     </div>
                 ) : (
                     <div className="text-zinc-600 border border-zinc-800 px-4 py-2 rounded text-[10px]">AWAITING SENSOR DATA</div>
                 )}
                 
                 {/* Crosshair */}
                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                    <div className="w-16 h-[1px] bg-emerald-500"></div>
                    <div className="absolute w-[1px] h-16 bg-emerald-500"></div>
                 </div>
                 
                 {generatedCloudData && !isProcessing && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/80 px-2 py-1 rounded text-[8px] text-yellow-500 font-mono border border-yellow-500/40 opacity-70">
                       [PT_CLOUD]<br/>
                       {generatedCloudData}
                    </div>
                 )}

                 {/* Status HUD */}
                 {isProcessing && (
                     <div className="absolute top-4 left-4 text-[8px] text-emerald-500 font-bold flex flex-col gap-1 bg-black/50 p-2 rounded">
                        <span>PTS: {15432}</span>
                        <span>DENSITY: HIGH</span>
                        <span>FOV: 120°</span>
                        <span>RANGE: 0.5 - 5.0m</span>
                     </div>
                 )}
             </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">ACQUISITION PARAMS</div>
             
             <div className="space-y-4">
                 <div>
                     <div className="text-[10px] text-zinc-500 mb-1">SENSOR SELECTION</div>
                     <select value={sensor} onChange={e => setSensor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer outline-none focus:border-emerald-500/50">
                       <option value="TrueDepth (Front)">TrueDepth (Front)</option>
                       <option value="LiDAR (Rear)">LiDAR (Rear)</option>
                       <option value="Stereo Vision">Stereo Vision</option>
                     </select>
                 </div>
                 
                 <div>
                     <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                       <span>RESOLUTION CLOUD</span>
                       <span className="text-emerald-400 font-mono">{accuracy}MM</span>
                     </div>
                     <input type="range" className="w-full accent-emerald-500" min="1" max="100" value={accuracy} onChange={(e) => setAccuracy(parseInt(e.target.value))} />
                 </div>

                 <div>
                     <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                       <span>SCAN RANGE LIMIT</span>
                       <span className="text-emerald-400 font-mono">{(density / 10).toFixed(1)}M</span>
                     </div>
                     <input type="range" className="w-full accent-emerald-500" min="1" max="100" value={density} onChange={(e) => setDensity(parseInt(e.target.value))} />
                 </div>
                 
                 <div className="flex items-center gap-2">
                     <input type="checkbox" checked={generateMesh} onChange={e => setGenerateMesh(e.target.checked)} className="accent-emerald-500" />
                     <span className="text-[10px] text-zinc-400">GENERATE MESH FROM POINTS</span>
                 </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col justify-between">
               <div>
                   <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">EXPORT OPTIONS</div>
                   <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                       <div onClick={() => setExportFormat("PLY FORMAT")} className={`bg-zinc-950 border rounded p-2 cursor-pointer transition-colors ${exportFormat === "PLY FORMAT" ? "text-emerald-400 border-emerald-500/30" : "border-zinc-800 text-zinc-400 hover:bg-zinc-800"}`}>PLY FORMAT</div>
                       <div onClick={() => setExportFormat("OBJ FORMAT")} className={`bg-zinc-950 border rounded p-2 cursor-pointer transition-colors ${exportFormat === "OBJ FORMAT" ? "text-emerald-400 border-emerald-500/30" : "border-zinc-800 text-zinc-400 hover:bg-zinc-800"}`}>OBJ FORMAT</div>
                       <div onClick={() => setExportFormat("GLTF STREAM")} className={`bg-zinc-950 border rounded p-2 cursor-pointer transition-colors ${exportFormat === "GLTF STREAM" ? "text-emerald-400 border-emerald-500/30" : "border-zinc-800 text-zinc-400 hover:bg-zinc-800"}`}>GLTF STREAM</div>
                       <div onClick={() => setExportFormat("RAW MATRIX")} className={`bg-zinc-950 border rounded p-2 cursor-pointer transition-colors ${exportFormat === "RAW MATRIX" ? "text-emerald-400 border-emerald-500/30" : "border-zinc-800 text-zinc-400 hover:bg-zinc-800"}`}>RAW MATRIX</div>
                   </div>
               </div>

               <button onClick={handleGenerate} disabled={isProcessing} className="w-full bg-emerald-900/40 border border-emerald-500/50 hover:bg-emerald-800/60 text-emerald-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4">
                  {isProcessing ? "ACQUIRING TOPOGRAPHY..." : <><ScanLine className="w-4 h-4" /> START SCAN SEQUENCE</>}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};
