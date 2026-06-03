import React, { useState } from "react";
import { Camera, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { GoogleGenAI } from "@google/genai";
import { VolumetricDataVisualizer } from "./visualizers/VolumetricDataVisualizer";

export const ArPresets = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const [isProcessing, setIsProcessing] = useState(false);

  const [opacity, setOpacity] = useState(80);
  const [roughness, setRoughness] = useState(20);
  const [emissive, setEmissive] = useState(150);

  const [selectedPreset, setSelectedPreset] = useState("CYBERPUNK VISOR");
  
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);

  React.useEffect(() => {
    return () => {
       if (mediaStream) {
          mediaStream.getTracks().forEach(t => t.stop());
       }
    }
  }, [mediaStream]);

  const handleToggleTarget = async () => {
    if (isScanning) {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      setIsScanning(false);
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      setIsScanning(true);
      setTimeout(() => {
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play();
          }
      }, 100);
    } catch(e) {
      toast.error("Camera required for AR preset simulation");
    }
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Compiling Profile...", { description: `Applying ${selectedPreset} configuration` });
    
    try {
      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "ArPresets",
        config: { preset: selectedPreset, opacity, roughness, emissive }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `${data.config.preset} profile loaded`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `ar_preset_${Date.now()}`,
        name: `AR Profile (${selectedPreset})`,
        loopCount: 8,
        volume: 0,
        fx: [],
        metadata: { preset: selectedPreset, opacity, roughness, emissive }
      });
      
      toast.success("Profile Embedded", { description: "AR tracking configuration updated." });
    } catch (e) {
      toast.error("Compilation Failed");
      useAppStore.getState().addSystemLog(`error: AR preset compilation failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Camera, { className: "w-4 h-4" })} AR Presets
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
        {JSON.stringify({ component: "AR Presets", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">AR Sandbox</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Augmented Reality Lens Configurator</p>
        </div>
        <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        <div className="w-full md:w-64 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
           <div className="text-xs text-zinc-400 font-bold border-b border-zinc-800 pb-2">ACTIVE PRESET</div>
           
           <div className="bg-zinc-950 border border-yellow-500/30 p-2 rounded">
               <div className="text-yellow-400 text-xs font-bold mb-1">{selectedPreset}</div>
               <div className="text-zinc-500 text-[9px]">Face Mesh + World Tracking</div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
               {["CYBERPUNK VISOR", "NEON GLITCH", "HOLO-FACE", "PARTICLE AURA", "WIRE FRAME", "THERMAL VISION", "DANCE EFFECTS", "FIRE BALLS", "ICE BEAM", "ENERGY SHIELD", "LIGHTNING STRIKE", "ANIMAL TRANSFORM", "SWAT UNIFORM", "ONI MASK"].map((preset, i) => (
                   <button key={i} onClick={() => setSelectedPreset(preset)} className={`text-left bg-zinc-950 border ${selectedPreset === preset ? 'border-yellow-500' : 'border-zinc-800 hover:border-yellow-500/50'} p-2 rounded transition-colors group`}>
                       <div className={`text-[10px] ${selectedPreset === preset ? 'text-yellow-400' : 'text-zinc-300 group-hover:text-yellow-400'}`}>{preset}</div>
                   </button>
               ))}
           </div>
           
           <button onClick={handleGenerate} disabled={isProcessing} className="w-full mt-2 bg-yellow-900/40 border border-yellow-500/50 hover:bg-yellow-800/60 text-yellow-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              {isProcessing ? <><AlertTriangle className="w-4 h-4 animate-spin"/> COMPILING SHADERS...</> : "APPLY LENS"}
           </button>
        </div>

      <div className="flex-1 flex flex-col gap-6 h-full">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 relative overflow-hidden flex items-center justify-center">
               <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                  <div className={`w-2 h-2 ${isScanning ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'} rounded-full`}></div>
                  <span className="text-[10px] text-zinc-400 font-bold bg-black/50 px-2 rounded">AR VIEWPORT</span>
              </div>
              
              {/* Simulated AR View */}
              {mediaStream ? (
                 <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 bg-[#0f172a] mix-blend-screen opacity-50 border border-zinc-800 m-4 rounded w-full h-full object-cover" />
              ) : (
                 <div className="absolute inset-0 bg-[#0f172a] mix-blend-screen opacity-50 border border-zinc-800 m-4 rounded"></div>
              )}
              
              <div className="absolute inset-0 pointer-events-none z-10">
                 <VolumetricDataVisualizer isActive={isScanning} intensity={isProcessing ? 3.5 : 1.0} trackId={`ar_preset_${selectedPreset}`} />
              </div>
                
                <div className="relative z-10 flex flex-col items-center">
                    {!isScanning ? (
                        <>
                           <Camera className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                           <button onClick={handleToggleTarget} className="mt-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/40 px-3 py-1 rounded text-[10px] font-bold">ENABLE CAMERA</button>
                        </>
                    ) : (
                        <button onClick={handleToggleTarget} className="absolute -top-16 opacity-30 hover:opacity-100 bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/40 px-3 py-1 rounded text-[10px] font-bold">DISABLE CAMERA</button>
                    )}
                    
                    {isProcessing && isScanning && (
                         <div className="absolute inset-0 flex items-center justify-center">
                            {/* Face Tracking HUD Placeholder */}
                            <div className="w-32 h-40 border border-yellow-500/50 rounded-[40%] relative animate-pulse">
                                <div className="absolute top-1/4 left-1/4 w-4 h-4 border border-yellow-400 transform -translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute top-1/4 right-1/4 w-4 h-4 border border-yellow-400 transform translate-x-1/2 -translate-y-1/2"></div>
                                <div className="absolute bottom-1/3 left-1/2 w-12 h-2 border-b-2 border-yellow-400 transform -translate-x-1/2 rounded-full"></div>
                            </div>
                            
                            {/* Scanning line */}
                            <div className="absolute top-0 w-[150%] h-1 bg-yellow-400/50 blur-sm shadow-[0_0_20px_#facc15] -translate-x-[15%] animate-[progress_2s_linear_infinite]"></div>
                         </div>
                    )}
                </div>
                
                {isProcessing && (
                    <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1 text-[8px] text-yellow-500 font-bold bg-black/60 p-2 rounded">
                        <div>FACE_DETECTED: TRUE</div>
                        <div>LANDMARKS: 468</div>
                        <div>LENS_MEM: 12MB</div>
                        <div>FPS: 60</div>
                    </div>
                )}
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-40 flex flex-col">
                <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">MATERIAL PROPERTIES</div>
                <div className="flex gap-6 h-full items-center px-4">
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>OPACITY</span>
                            <span className="text-yellow-400 font-mono">{(opacity / 100).toFixed(1)}</span>
                        </div>
                        <input type="range" className="w-full accent-yellow-500" min="0" max="100" value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>ROUGHNESS</span>
                            <span className="text-yellow-400 font-mono">{(roughness / 100).toFixed(1)}</span>
                        </div>
                        <input type="range" className="w-full accent-yellow-500" min="0" max="100" value={roughness} onChange={(e) => setRoughness(parseInt(e.target.value))} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                            <span>EMISSIVE</span>
                            <span className="text-yellow-400 font-mono">{(emissive / 100).toFixed(1)}</span>
                        </div>
                        <input type="range" className="w-full accent-yellow-500" min="0" max="200" value={emissive} onChange={(e) => setEmissive(parseInt(e.target.value))} />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
