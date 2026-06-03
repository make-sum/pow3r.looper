import React, { useState } from "react";
import { Box, Play, AlertTriangle, Sparkles, SunMoon } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { GoogleGenAI } from "@google/genai";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Icosahedron, MeshDistortMaterial, Stats, View, PerspectiveCamera } from "@react-three/drei";

export const StageBuilder = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);

  const [materials, setMaterials] = useState("Vaporwave");
  const [lights, setLights] = useState(80);

  const triggerDeploy = async () => {
    setIsProcessing(true);
    toast.info("Configuring Stage...", { description: "Pushing 3D pipeline parameters" });
    
    try {
      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "StageBuilder",
        config: { materials, lights }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Stage Config Committed`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);
      toast.success("Stage Synced", { description: "3D parameters deployed to scene." });
    } catch (e) {
      toast.error("Config Failed");
      useAppStore.getState().addSystemLog(`error: StageBuilder failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-purple-400 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(192,132,252,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-purple-400" />
        <div className="font-mono font-bold text-xs text-purple-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2">
          3D Stage Builder
        </div>
        <div className="text-[10px] text-purple-300">R3F & Particle Config</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-purple-400" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <icosahedronGeometry args={[0.5]} />
        <meshStandardMaterial color="#c084fc" wireframe />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-purple-400 font-mono bg-zinc-950 p-4 border border-purple-500/20 rounded">
        {JSON.stringify({ component: "StageBuilder", canvas: "R3F", mapped: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]">3D Stage Architect</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">R3F Spatial Compositor</p>
        </div>
        <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] rounded animate-pulse">
          WEBGL: COMPILED
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
                <span>SCENE GRAPH</span>
                <span className="text-[8px] bg-orange-500/20 border border-orange-500/50 text-orange-400 px-1 py-0.5 rounded cursor-pointer hover:bg-orange-500 hover:text-black transition-colors">
                  + ADD [BLD] NODE
                </span>
             </div>
             <div className="flex flex-col gap-2 text-[10px]">
                 <div className="flex justify-between bg-zinc-950 p-2 border border-purple-500/30 rounded text-purple-300">
                     <span>Main_Rig_01 (Null)</span>
                     <span>XYZ</span>
                 </div>
                 <div className="flex justify-between bg-zinc-800 bg-opacity-30 p-2 border border-zinc-700 rounded text-zinc-400 ml-4">
                     <span>Icosahedron_Mesh (Mesh)</span>
                     <span>{materials}</span>
                 </div>
                 
                 {/* Lighting Node */}
                 <div className="flex justify-between bg-zinc-950 p-2 border border-purple-500/20 rounded text-purple-300 ml-4 group relative">
                     <span className="flex items-center gap-1"><SunMoon className="w-3 h-3 text-yellow-400"/> Ambient / Point</span>
                     <span className="text-[8px] bg-yellow-900/40 text-yellow-400 px-1 rounded flex items-center">LGT</span>
                     {/* Hover settings menu */}
                     <div className="absolute top-0 right-10 hidden group-hover:flex bg-zinc-900 border border-zinc-700 rounded p-1 gap-1 shadow-xl z-20">
                        <span className="text-[8px] text-zinc-300 hover:text-white px-1">INTENSITY: {lights}%</span>
                        <span className="text-[8px] text-zinc-300 hover:text-white px-1 border-l border-zinc-700">HDRI: city</span>
                     </div>
                 </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col justify-between">
              <div>
                  <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">PROPERTIES</div>
                  <div className="text-[10px] text-zinc-500 italic text-center p-4">
                      Select a node from the Scene Graph to view its properties.
                  </div>
              </div>

               <button onClick={triggerDeploy} disabled={isProcessing} className="w-full mt-6 bg-purple-900/40 border border-purple-500/50 hover:bg-purple-800/60 text-purple-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isProcessing ? "COMPILING MESHES..." : <><Box className="w-4 h-4" /> APPLY STAGE CONFIG</>}
               </button>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full relative overflow-hidden">
           <div className="absolute inset-0 bg-black pointer-events-auto">
               <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} intensity={1} color="#c084fc" />
                  <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
                  <Icosahedron args={[1, 4]}>
                     <MeshDistortMaterial
                        color="#c084fc"
                        attach="material"
                        distort={isProcessing ? 0.6 : 0.3}
                        speed={isProcessing ? 3 : 1.5}
                        roughness={0.2}
                        metalness={0.8}
                     />
                  </Icosahedron>
                  <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={false} />
                  <Environment preset="city" />
                  <Stats showPanel={0} className="stats-panel" />
               </Canvas>
               
               {/* Viewport UI overlays */}
               <div className="absolute top-4 left-4 z-20 flex gap-2">
                   <span className="text-[9px] bg-zinc-900/80 px-2 py-1 rounded text-purple-400 border border-zinc-800 font-bold glass">PERSP</span>
                   <span className="text-[9px] bg-zinc-900/80 px-2 py-1 rounded text-zinc-500 border border-zinc-800 cursor-pointer hover:text-zinc-300 glass">TOP</span>
                   <span className="text-[9px] bg-zinc-900/80 px-2 py-1 rounded text-zinc-500 border border-zinc-800 cursor-pointer hover:text-zinc-300 glass">FRONT</span>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};
