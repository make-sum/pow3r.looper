import React, { useState, useEffect } from "react";
import { SlidersHorizontal, AlertTriangle, Layers } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";

export const Mixer = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const sequenceBlocks = useAppStore(state => state.sequenceBlocks);
  const updateSequenceBlock = useAppStore(state => state.updateSequenceBlock);
  const isPlaying = useAppStore(state => state.isPlaying);
  
  const [tick, setTick] = useState(0);

  useEffect(() => {
     let isActive = true;
     const loop = () => {
         if (!isActive) return;
         setTick(Date.now() / 150);
         requestAnimationFrame(loop);
     };
     if (isPlaying) {
         loop();
     }
     return () => { isActive = false; };
  }, [isPlaying]);

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(SlidersHorizontal, { className: "w-4 h-4" })} Mixer
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
        {JSON.stringify({ component: "Mixer", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  // Derive logical channels from existing sequence blocks
  const channels = sequenceBlocks.length > 0 ? sequenceBlocks : [
     // Fallback dummies if no tracks exist, just for visual layout context
     { id: 'dummy_1', name: 'NO TRACKS LOADED', volume: 0, fake: true }
  ];

  return (
    <div className="flex flex-col font-sans h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold font-mono text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]">Master Audio Console</h2>
          <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-widest">Multi-Channel Digital Signal Processing</p>
        </div>
        <div className="px-3 py-1 bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[10px] font-mono rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto overflow-y-hidden min-h-0 flex gap-4 custom-scrollbar items-stretch pb-6">
        
        {/* Dynamic Channels mapped to sequence blocks */}
        {channels.map((track, i) => {
            const isDummy = (track as any).fake;
            const vol = track.volume ?? 75;
            
            return (
              <div key={track.id} className={`flex flex-col items-center min-w-[120px] max-w-[140px] flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 shadow-inner relative group`}>
                 <div className={`text-[9px] font-bold font-mono mb-4 text-zinc-400 text-center tracking-tighter w-full truncate px-1`}>{track.name.toUpperCase()}</div>
                 
                 {/* EQ Knobs */}
                 {!isDummy && (
                   <div className="flex flex-col gap-3 mb-6 w-full">
                     <div className="flex flex-col items-center">
                       <div className="text-[8px] font-mono text-zinc-600 mb-1 tracking-widest">HIGH</div>
                       <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900 relative shadow-inner">
                         <div className="absolute w-1 h-3 bg-pink-400 rounded-full top-1 left-1/2 -translate-x-1/2 origin-bottom rotate-45"></div>
                       </div>
                     </div>
                     <div className="flex flex-col items-center">
                       <div className="text-[8px] font-mono text-zinc-600 mb-1 tracking-widest">MID</div>
                       <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900 relative shadow-inner">
                         <div className="absolute w-1 h-3 bg-pink-400 rounded-full top-1 left-1/2 -translate-x-1/2 origin-bottom -rotate-12"></div>
                       </div>
                     </div>
                     <div className="flex flex-col items-center">
                       <div className="text-[8px] font-mono text-zinc-600 mb-1 tracking-widest">LOW</div>
                       <div className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-900 relative shadow-inner">
                         <div className="absolute w-1 h-3 bg-pink-400 rounded-full top-1 left-1/2 -translate-x-1/2 origin-bottom rotate-90"></div>
                       </div>
                     </div>
                   </div>
                 )}
                 {isDummy && <div className="mb-6 flex-1 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-zinc-800" /></div>}

                  {/* VU Meter & Fader */}
                 <div className="flex-1 flex gap-3 h-full mb-4 mt-auto">
                   
                   {/* Virtual VU Meter */}
                   <div className="w-2 bg-black rounded-sm overflow-hidden flex flex-col justify-end border border-zinc-900">
                     <div className={`w-full transition-all duration-75 ${isPlaying && !isDummy && vol > 0 ? 'bg-gradient-to-t from-green-500 via-yellow-400 to-red-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-transparent'}`} style={{ height: isPlaying && !isDummy && vol > 0 ? `${(Math.sin((tick) + (i * 2.5)) * 0.2 + 0.6) * (vol / 100) * 80 + 10}%` : '5%' }}></div>
                   </div>
                   
                   {/* Interactive Fader */}
                   <div className="w-8 h-[200px] bg-zinc-900 rounded-sm relative flex justify-center py-2 px-[1px] border border-zinc-800 shadow-inner">
                     <div className="absolute w-full h-[1px] bg-zinc-800 top-1/4"></div>
                     <div className="absolute w-full h-[1px] bg-zinc-800 top-1/2"></div>
                     <div className="absolute w-full h-[1px] bg-zinc-800 top-3/4"></div>
                     <input 
                         type="range" 
                         disabled={isDummy as boolean}
                         className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-6 -rotate-90 appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-zinc-300 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-lg cursor-pointer ${isDummy ? 'opacity-20 cursor-not-allowed' : ''}`} 
                         value={vol}
                         onChange={(e) => {
                             if (!isDummy) {
                                updateSequenceBlock(track.id, { volume: parseInt(e.target.value) });
                             }
                         }}
                     />
                     <div className="absolute bottom-2 text-[8px] font-mono text-zinc-600 bg-black/50 px-1 rounded pointer-events-none">{vol}%</div>
                   </div>
                 </div>

                 {/* Solo / Mute */}
                 <div className="flex gap-2 w-full justify-center mt-2">
                   <button disabled={isDummy as boolean} className={`w-6 h-6 rounded flex items-center justify-center font-bold font-mono text-[9px] transition-colors ${isDummy ? 'opacity-20' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700'}`}>S</button>
                   <button 
                       disabled={isDummy as boolean} 
                       onClick={() => updateSequenceBlock(track.id, { volume: vol === 0 ? 80 : 0 })}
                       className={`w-6 h-6 rounded flex items-center justify-center font-bold font-mono text-[9px] transition-colors ${isDummy ? 'opacity-20' : (vol === 0 ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-red-900/30 text-red-500 hover:bg-red-900/50')}`}
                   >M</button>
                 </div>
              </div>
            );
        })}

        {/* Master Bus Channel */}
        <div className={`flex flex-col items-center min-w-[120px] max-w-[140px] flex-1 bg-black border border-pink-500/50 rounded-lg p-4 shadow-[0_0_20px_rgba(244,114,182,0.1)] relative`}>
            <div className={`text-[10px] font-bold font-mono mb-6 text-pink-400 tracking-widest text-center uppercase`}>MASTER</div>
            
            <div className="w-12 h-12 rounded-full border-2 border-pink-900 bg-zinc-950 relative shadow-[inset_0_0_10px_rgba(244,114,182,0.2)] mb-auto flex items-center justify-center mt-4">
                <Layers className="w-5 h-5 text-pink-500/50" />
            </div>

            <div className="flex-1 flex gap-3 h-full mb-4 mt-auto">
               <div className="flex gap-[2px]">
                   <div className="w-2 bg-zinc-900 rounded-sm overflow-hidden flex flex-col justify-end">
                     <div className={`w-full transition-all duration-75 ${isPlaying ? 'bg-gradient-to-t from-pink-600 via-pink-400 to-white shadow-[0_0_10px_rgba(244,114,182,0.5)]' : 'bg-transparent'}`} style={{ height: isPlaying ? `${(Math.sin((tick) + 5) * 0.1 + 0.7) * 75}%` : '5%' }}></div>
                   </div>
                   <div className="w-2 bg-zinc-900 rounded-sm overflow-hidden flex flex-col justify-end">
                     <div className={`w-full transition-all duration-75 ${isPlaying ? 'bg-gradient-to-t from-pink-600 via-pink-400 to-white shadow-[0_0_10px_rgba(244,114,182,0.5)]' : 'bg-transparent'}`} style={{ height: isPlaying ? `${(Math.sin((tick) + 6) * 0.1 + 0.7) * 72}%` : '5%' }}></div>
                   </div>
               </div>
               
               <div className="w-8 h-[200px] bg-zinc-900 rounded-sm relative flex justify-center py-2 px-[1px] border border-pink-900/50 shadow-inner">
                 <div className="absolute w-full h-[1px] bg-pink-900/50 top-1/4"></div>
                 <div className="absolute w-full h-[1px] bg-pink-900/50 top-1/2"></div>
                 <div className="absolute w-full h-[1px] bg-pink-900/50 top-3/4"></div>
                 <input type="range" defaultValue={85} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-6 -rotate-90 appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-pink-400 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(244,114,182,0.6)] cursor-pointer" />
               </div>
            </div>

            {/* Hardware Insert */}
            <div className="w-full h-8 bg-zinc-900 border border-zinc-700/50 rounded flex items-center justify-center mt-2 group cursor-pointer hover:bg-zinc-800">
               <span className="text-[8px] font-mono text-zinc-500 group-hover:text-pink-300">LIMITER: ON</span>
            </div>
        </div>
      </div>

      {/* Sync Button */}
      <button 
          onClick={async () => {
              const req = buildPow3rRequest("UPDATE_PARAMETER", { target: "Mixer", config: { action: "sync_console" } });
              const res = await executePow3rWorkflow(req, async () => { return { msg: "Audio Console Synced to Cloud DSP", type: "System Control", metadata: { synced: true } }; });
              appendLogs(res);
              toast.success("Mix Committed", { description: "Console synchronized with Cloud DSP." });
          }}
          className="bg-pink-900/40 border border-pink-500/50 hover:bg-pink-800/60 text-pink-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all w-full shadow-[0_0_15px_rgba(244,114,182,0.1)]"
      >
          <SlidersHorizontal className="w-4 h-4" /> COMMIT MIX TO WORKFLOW PIPELINE
      </button>
    </div>
  );
};
