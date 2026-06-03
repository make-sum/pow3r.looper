import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Lightbulb, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { useGalleryStore } from "../services/galleryService";

export const LightGen = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);

  const [intensity, setIntensity] = useState(100);
  const [strobe, setStrobe] = useState(0);
  const [colorTemp, setColorTemp] = useState(5600);
  const [selectedMood, setSelectedMood] = useState("CONCERT STROBE");
  const [generatedLightPlan, setGeneratedLightPlan] = useState<string | null>(null);
  const globalBpm = useAppStore(state => state.globalBpm); 

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Transmitting DMX...", { description: `Sending ${selectedMood} lighting arrays to fixture nodes` });
    
    try {
      const currentConfig = `Mood: ${selectedMood}, Intensity: ${intensity}, Strobe: ${strobe}, Temp: ${colorTemp}`;
      const response = await proxyGenerateText(`Given the following stage lighting config, output a short comma-separated list of 5 HEX color codes representing the DMX array palette. Configuration: ${currentConfig}`);

      const textOutput = response || "#000000, #000000";
      setGeneratedLightPlan(textOutput);

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "LightGen",
        config: { mood: selectedMood, intensity, strobe, colorTemp, hexArray: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Applied lighting DMX config`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      const configObj = { mood: selectedMood, intensity, strobe, colorTemp, hexArray: textOutput };

      useAppStore.getState().addSequenceBlock({
        id: `light_gen_${Date.now()}`,
        name: `DMX Lighting State (${selectedMood})`,
        loopCount: 8,
        volume: 0,
        fx: [],
        metadata: configObj
      });
      addGalleryItem({
         title: `DMX state (${selectedMood})`,
         type: "lighting",
         url: `data:application/json;base64,${btoa(JSON.stringify(configObj))}`,
         format: "json",
         tags: ["lighting", "dmx", selectedMood.toLowerCase()],
         albums: [],
         metadata: configObj,
         sourcePageId: "lighting"
      });
      
      toast.success("DMX State Active", { description: "Added DMX trigger to timeline and Global Gallery." });
    } catch (e: any) {
      toast.error("DMX Failed");
      useAppStore.getState().addSystemLog(`error: Light transmission failed: ${e.message || String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Lightbulb, { className: "w-4 h-4" })} Light Gen
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
        {JSON.stringify({ component: "Light Gen", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">DMX Lighting Configurator</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Stage Lighting & Environment Generation</p>
        </div>
        <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">FIXTURE CONTROL</div>
             
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>GLOBAL INTENSITY</span>
                   <span className="text-yellow-400 font-mono">{intensity}%</span>
                 </div>
                 <input type="range" className="w-full accent-yellow-500" min="0" max="100" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))} />
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>STROBE RATE</span>
                   <span className="text-yellow-400 font-mono">{strobe} Hz</span>
                 </div>
                 <input type="range" className="w-full accent-yellow-500" min="0" max="30" value={strobe} onChange={(e) => setStrobe(parseInt(e.target.value))} />
               </div>

               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>COLOR TEMP</span>
                   <span className="text-yellow-400 font-mono">{colorTemp}K</span>
                 </div>
                 <input type="range" className="w-full accent-yellow-500" min="2000" max="8000" value={colorTemp} onChange={(e) => setColorTemp(parseInt(e.target.value))} />
               </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">MOOD PRESETS</div>
             <div className="grid grid-cols-2 gap-2">
                 {["CYBERPUNK RED", "NEON BLUE", "WARM TUNGSTEN", "CONCERT STROBE"].map((mood) => (
                   <button 
                     key={mood}
                     onClick={() => setSelectedMood(mood)}
                     className={`text-xs py-2 rounded transition-colors ${
                       selectedMood === mood 
                         ? 'bg-zinc-950 border border-yellow-500/50 text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]'
                         : 'bg-zinc-950 border border-zinc-800 hover:border-yellow-500/50 text-zinc-400 hover:text-yellow-400'
                     }`}
                   >
                     {mood}
                   </button>
                 ))}
             </div>
             
             <button onClick={handleGenerate} disabled={isProcessing} className="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded-md text-xs font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isProcessing ? "TRANSMITTING DMX..." : <><Lightbulb className="w-3 h-3" /> APPLY LIGHTING</>}
             </button>
           </div>
        </div>

        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
           <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">FIXTURE VISUALIZER</div>
           <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden p-6">
               <div className="grid grid-cols-4 gap-8 w-full max-w-lg">
                   {[...Array(8)].map((_, i) => {
                       const colors = generatedLightPlan ? generatedLightPlan.split(',').map(c => c.trim()) : [];
                       const fixtureColor = colors.length > 0 ? colors[i % colors.length] : 'transparent';
                       const isDim = !isProcessing && !generatedLightPlan;
                       const pulseDuration = (60 / globalBpm) * (strobe > 0 ? (1 / (strobe/5)) : 1);
                       
                       return (
                           <div key={i} className="flex flex-col items-center gap-2">
                               <div 
                                   className={`w-8 h-8 rounded-full ${isDim ? 'bg-zinc-800 shadow-[inset_0_0_10px_rgba(0,0,0,1)]' : ''}`}
                                   style={{
                                       backgroundColor: isProcessing ? '#facc15' : fixtureColor,
                                       boxShadow: isDim ? undefined : `0 0 20px ${isProcessing ? '#facc15' : fixtureColor}`,
                                       animation: isDim ? 'none' : `pulse ${pulseDuration}s ease-in-out infinite alternate${isProcessing ? ', ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' : ''}`,
                                       opacity: intensity / 100
                                   }}
                               ></div>
                               <div className="text-[10px] text-zinc-600 font-mono">CH-{i+1}</div>
                           </div>
                       )
                   })}
               </div>
               {generatedLightPlan && !isProcessing && (
                  <div className="absolute inset-x-0 bottom-4 flex justify-center">
                     <div className="bg-zinc-950/80 px-4 py-2 rounded-xl text-yellow-400 text-[10px] font-mono border border-yellow-500/30">
                        {generatedLightPlan.split(',').map((colorHex, idx) => (
                            <span key={idx} className="inline-block mr-2 items-center">
                               <span className="inline-block w-2 h-2 rounded-full mr-1" style={{backgroundColor: colorHex.trim()}}></span>
                               {colorHex.trim()}
                            </span>
                        ))}
                     </div>
                  </div>
               )}
               {isProcessing && (
                 <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className="w-[150%] h-[20%] bg-gradient-to-t from-transparent via-yellow-500/10 to-transparent rotate-12 blur-xl animate-[pulse_0.5s_ease-in-out_infinite]"></div>
                   <div className="w-[150%] h-[20%] bg-gradient-to-t from-transparent via-yellow-500/20 to-transparent -rotate-12 blur-xl animate-[pulse_0.3s_ease-in-out_infinite]"></div>
                 </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};
