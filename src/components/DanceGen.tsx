import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Activity, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { useGalleryStore } from "../services/galleryService";

export const DanceGen = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);

  const [prompt, setPrompt] = useState("High energy hip-hop routine, 120bpm, aggressive blocking, wide stance.");
  const [energy, setEnergy] = useState(85);
  const [tempo, setTempo] = useState(120);
  const [generatedChoreo, setGeneratedChoreo] = useState<string | null>(null);
  const globalBpm = useAppStore(state => state.globalBpm); 

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Synthesizing Motion...", { description: "Sending payload to Kinetix via Pow3r" });
    
    try {
      const currentConfig = `Energy: ${energy}, Tempo: ${tempo}`;
      const response = await proxyGenerateText(`Given the following dance prompt, generate a short JSON-like markup choreography sequence containing 3 major moves and timing. Prompt: ${prompt}\nConfig: ${currentConfig}`);

      const textOutput = response || "{}";
      setGeneratedChoreo(textOutput);

      const req = buildPow3rRequest("INFER_GENERATIVE_TRACK", {
        target: "DanceGen",
        prompt,
        config: { energy, tempo, generatedChoreo: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Motion synthesis complete`,
          type: "Animation Base",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `dance_gen_${Date.now()}`,
        name: `SMPL-X Motion (${tempo}BPM)`,
        loopCount: 4,
        volume: 0,
        fx: [],
        metadata: { energy, tempo, prompt, data: textOutput, motionStyle: energy > 80 ? 'CHOPPY' : 'FLOW' }
      });
      
      addGalleryItem({
         title: `Choreography (${tempo}BPM)`,
         type: "choreography",
         url: `data:application/json;base64,${btoa(textOutput)}`,
         format: "json",
         tags: ["dance", "motion", `${tempo}bpm`, energy > 80 ? 'high-energy' : 'low-energy'],
         albums: [],
         metadata: { energy, tempo, prompt, data: textOutput },
         sourcePageId: "choreography"
      });
      
      toast.success("Synthesis Successful", { description: "Added choreography to sequencer and Global Gallery." });
    } catch (e: any) {
      toast.error("Generation Failed");
      useAppStore.getState().addSystemLog(`error: Dance generation failed: ${e.message || String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Activity, { className: "w-4 h-4" })} Dance Gen
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
        {JSON.stringify({ component: "Dance Gen", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.6)]">Kinetix Gen</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">AI Choreography Synthesis</p>
        </div>
        <div className="px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">CHOREOGRAPHY PROMPT</div>
             <textarea 
               className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-300 text-[10px] focus:outline-none focus:border-fuchsia-500"
               placeholder="Describe the motion e.g., 'A fluid contemporary dance sequence with sharp popping transitions, transitioning into a moonwalk...'"
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
             />
             
             <div className="grid grid-cols-2 gap-4 mt-4">
                 <div>
                     <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                       <span>ENERGY LEVEL</span>
                       <span className="text-fuchsia-400 font-mono">{energy > 80 ? 'HIGH' : energy > 40 ? 'MED' : 'LOW'}</span>
                     </div>
                     <input type="range" className="w-full accent-fuchsia-500" min="0" max="100" value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} />
                 </div>
                 <div>
                     <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                       <span>TEMPO SYNC</span>
                       <span className="text-fuchsia-400 font-mono">{tempo} BPM</span>
                     </div>
                     <input type="range" className="w-full accent-fuchsia-500" min="60" max="200" value={tempo} onChange={(e) => setTempo(parseInt(e.target.value))} />
                 </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">MODEL & CONSTRAINTS</div>
             <div className="space-y-4">
               <div>
                 <div className="text-[10px] text-zinc-500 mb-1">BASE MODEL</div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer">
                   <option>SMPL-X Kinematics (v4)</option>
                   <option>EdgeMotion Transformer</option>
                   <option>MoCap Transfer AI</option>
                 </select>
               </div>
               
               <div>
                 <div className="text-[10px] text-zinc-500 mb-2">STYLE MODIFIERS</div>
                 <div className="flex flex-wrap gap-2">
                     <span className="bg-fuchsia-900/40 text-fuchsia-300 border border-fuchsia-500 px-2 py-1 rounded text-[9px] cursor-pointer hover:bg-fuchsia-800/60">HIP-HOP</span>
                     <span className="bg-fuchsia-900/40 text-fuchsia-300 border border-fuchsia-500 px-2 py-1 rounded text-[9px] cursor-pointer hover:bg-fuchsia-800/60">POPPING</span>
                     <span className="bg-zinc-950 text-zinc-500 border border-zinc-800 px-2 py-1 rounded text-[9px] cursor-pointer hover:bg-zinc-800">BALLET</span>
                     <span className="bg-zinc-950 text-zinc-500 border border-zinc-800 px-2 py-1 rounded text-[9px] cursor-pointer hover:bg-zinc-800">CONTEMPORARY</span>
                 </div>
               </div>
             </div>
             
             <button onClick={handleGenerate} disabled={isProcessing} className="w-full mt-6 bg-fuchsia-900/40 border border-fuchsia-500/50 hover:bg-fuchsia-800/60 text-fuchsia-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isProcessing ? "SYNTHESIZING MOTION..." : <><Activity className="w-4 h-4" /> GENERATE CHOREOGRAPHY</>}
             </button>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
           <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">TIMELINE & PREVIEW</div>
           <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative flex flex-col overflow-hidden p-4">
               
               {/* 3D Skeleton Preview Placeholder */}
               <div className="flex-1 border border-zinc-800 rounded mb-4 relative flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-[#0f172a] mix-blend-screen opacity-20"></div>
                   <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3, transform: 'perspective(500px) rotateX(60deg) scale(2)', transformOrigin: 'bottom' }}></div>
                   
                   {/* Abstract Skeleton */}
                   <div 
                       className={`relative w-24 h-48 transition-transform duration-300 ${!isProcessing && generatedChoreo ? 'animate-bounce' : ''}`}
                       style={(!isProcessing && generatedChoreo) ? { animationDuration: `${60 / globalBpm}s` } : {}}
                   >
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-8 border border-fuchsia-400 rounded-full"></div>
                       <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[2px] h-16 bg-fuchsia-500"></div>
                       
                       {/* Arms */}
                       <div 
                         className={`absolute top-8 left-1/2 w-12 h-[2px] bg-fuchsia-500 origin-left ${!isProcessing && generatedChoreo ? 'animate-spin' : '-rotate-45'}`}
                         style={(!isProcessing && generatedChoreo) ? { animationDuration: `${(60 / globalBpm) * (energy > 80 ? 0.5 : 1)}s` } : {}}
                       ></div>
                       <div 
                         className={`absolute top-8 right-1/2 w-12 h-[2px] bg-fuchsia-500 origin-right ${!isProcessing && generatedChoreo ? 'animate-[spin_1s_linear_infinite_reverse]' : 'rotate-45'}`}
                         style={(!isProcessing && generatedChoreo) ? { animationDuration: `${(60 / globalBpm) * (energy > 80 ? 0.5 : 1)}s` } : {}}
                       ></div>
                       
                       {/* Legs */}
                       <div 
                         className={`absolute top-24 left-1/2 w-16 h-[2px] bg-fuchsia-500 origin-left ${!isProcessing && generatedChoreo ? 'rotate-[75deg] animate-pulse' : 'rotate-[75deg]'}`}
                         style={(!isProcessing && generatedChoreo) ? { animationDuration: `${60 / globalBpm}s` } : {}}
                       ></div>
                       <div 
                         className={`absolute top-24 right-1/2 w-16 h-[2px] bg-fuchsia-500 origin-right ${!isProcessing && generatedChoreo ? '-rotate-[75deg] animate-pulse' : '-rotate-[75deg]'}`}
                         style={(!isProcessing && generatedChoreo) ? { animationDuration: `${60 / globalBpm}s` } : {}}
                       ></div>
                   </div>

                   {isProcessing && (
                      <div className="absolute right-4 top-4 bg-fuchsia-500/20 border border-fuchsia-500 text-fuchsia-400 text-[8px] px-2 py-1 rounded animate-pulse">
                          RENDERING BVH...
                      </div>
                   )}
                   {generatedChoreo && !isProcessing && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                         <div className="text-fuchsia-400 text-[8px] font-mono whitespace-pre-wrap text-left w-full h-full overflow-auto break-all">
                             {generatedChoreo}
                         </div>
                      </div>
                   )}
               </div>

               {/* Timeline Sequence */}
               <div className="h-16 bg-zinc-950 rounded border border-zinc-800 relative flex p-1 gap-1">
                   {['INTRO', 'BUILD', 'DROP', 'CHORUS', 'OUTRO'].map((part, i) => (
                       <div key={part} className={`flex-1 rounded border flex flex-col p-1 ${i === 2 ? 'bg-fuchsia-900/30 border-fuchsia-500' : 'bg-zinc-900 border-zinc-800'}`}>
                           <span className={`text-[8px] ${i === 2 ? 'text-fuchsia-400' : 'text-zinc-500'}`}>{part}</span>
                           {isProcessing && i === 2 && (
                               <div className="w-full h-[2px] bg-fuchsia-400 mt-auto animate-[progress_2s_linear_infinite]"></div>
                           )}
                       </div>
                   ))}
               </div>

           </div>
        </div>
      </div>
    </div>
  );
};
