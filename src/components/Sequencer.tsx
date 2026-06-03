import React, { useState } from "react";
import { Layers, Play, Pause, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { VolumetricDataVisualizer } from './visualizers/VolumetricDataVisualizer';

export const Sequencer = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const sequenceBlocks = useAppStore(state => state.sequenceBlocks);
  const isPlaying = useAppStore(state => state.isPlaying);
  const setIsPlaying = useAppStore(state => state.setIsPlaying);
  const playhead = useAppStore(state => state.playhead);
  const setPlayhead = useAppStore(state => state.setPlayhead);

  const [zoom, setZoom] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedTracks, setExpandedTracks] = useState<Record<string, boolean>>({
      'master': true
  });

  const toggleTrackSize = (id: string) => {
      setExpandedTracks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState && playhead >= 99) {
       setPlayhead(0);
    }
    
    toast.info(nextState ? "Playing Sequences..." : "Pausing Sequences...", { description: "Global timeline updated" });
    
    try {
      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "Sequencer",
        config: { action: nextState ? "play_all" : "pause" }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Timeline synced`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);
    } catch (e) {
      toast.error("Playback Failed");
      useAppStore.getState().addSystemLog(`error: Sequencer playback failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Layers, { className: "w-4 h-4" })} Sequencer
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
        {JSON.stringify({ component: "Sequencer", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-4 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-2 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-heading text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]">Master Sequencer</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Global Timeline Orchestrator</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-[10px] text-zinc-500 border border-zinc-800 px-2 py-1 rounded bg-zinc-950">
               TC: <span className="text-indigo-400 font-bold ml-1">00:01:23:14</span>
            </div>
            <div className="text-[10px] text-zinc-500 border border-zinc-800 px-2 py-1 rounded bg-zinc-950 flex gap-2">
               <span>BPM: <span className="text-indigo-400">120</span></span>
               <span className="text-zinc-700">|</span>
               <span>SIG: <span className="text-indigo-400">4/4</span></span>
            </div>
            <button onClick={handleGenerate} disabled={isProcessing} className="bg-indigo-900/40 border border-indigo-500/50 hover:bg-indigo-800/60 text-indigo-200 px-4 py-2 rounded text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isPlaying ? <><Pause className="w-3 h-3 fill-indigo-200" /> PAUSE</> : <><Play className="w-3 h-3 fill-indigo-200" /> PLAY ALL</>}
            </button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col min-h-0">
          
          {/* Timeline Header (Ruler) */}
          <div className="h-6 bg-zinc-950 border-b border-zinc-800 flex relative text-[8px] text-zinc-600 pl-48">
              {[1,2,3,4,5,6,7,8,9,10].map(bar => (
                  <div key={bar} className="flex-1 border-l border-zinc-800 pl-1 h-full flex flex-col justify-end">
                      {bar}|0
                  </div>
              ))}
              {/* Playhead */}
              <div className={`absolute top-0 bottom-0 w-[1px] bg-indigo-500 z-20`} style={{ left: `calc(12rem + ${playhead} * (100% - 12rem) / 100)` }}>
                  <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-indigo-500 absolute -top-[1px] -left-[2px]"></div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative z-0">
             
             {/* 3D Volumetric Track Data Overlay */}
             {sequenceBlocks.length > 0 && (
                <div className="absolute inset-0 pl-48 opacity-20 pointer-events-none mix-blend-screen -z-10">
                   <VolumetricDataVisualizer isActive={isPlaying} intensity={0.5} trackId="background" />
                </div>
             )}

             {/* Cross-track Grid Lines */}
             <div className="absolute inset-0 pointer-events-none flex pl-48 opacity-20 -z-10">
                 {[1,2,3,4,5,6,7,8,9,10].map(bar => (
                      <div key={bar} className="flex-1 border-l border-zinc-700 h-full"></div>
                 ))}
             </div>

             {/* Master Track (Top) */}
             <div 
                className={`flex border-b-2 border-indigo-500/50 group bg-zinc-950 shadow-[0_4px_15px_rgba(0,0,0,0.5)] z-10 sticky top-0 transition-all duration-300 ease-in-out cursor-pointer ${expandedTracks['master'] ? 'h-[336px]' : 'h-16'}`}
                onDoubleClick={() => toggleTrackSize('master')}
             >
                 {/* Track Header */}
                 <div className="w-48 bg-zinc-950 border-r border-indigo-500/30 flex flex-col justify-center px-3 text-[10px] sticky left-0 z-20">
                     <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.8)] tracking-widest">MASTER COMPOSITE</span>
                     <span className="text-[8px] text-zinc-500 font-mono mt-1">ALL CHANNELS AGGREGATED</span>
                     <span className="text-[7px] text-zinc-600 mt-1 uppercase tracking-widest leading-tight">Double-click to toggle zoom</span>
                     <div className="flex gap-2 mt-2">
                         <div className="w-2 h-2 rounded-full bg-cyan-400/80 shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
                         <div className="w-2 h-2 rounded-full bg-rose-400/80 shadow-[0_0_5px_rgba(244,63,94,0.8)]"></div>
                         <div className="w-2 h-2 rounded-full bg-emerald-400/80 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                         <div className="w-2 h-2 rounded-full bg-violet-400/80 shadow-[0_0_5px_rgba(139,92,246,0.8)]"></div>
                     </div>
                 </div>
                 {/* Track Content */}
                 <div className="flex-1 relative bg-zinc-900 border border-zinc-800/80 rounded m-1 mb-0 overflow-hidden shadow-inner">
                     <VolumetricDataVisualizer isActive={isPlaying} intensity={1.0} trackId="master" />
                     <div className="absolute top-1 left-2 text-[8px] text-zinc-500 font-mono pointer-events-none drop-shadow-md z-10 bg-zinc-950/50 px-1 rounded">
                         THREEJS COMPOSITE | SIZE ATTENUATION: TRUE | 3D TIMECODE POLYGONS mapped to SSML & YAIP Traits
                     </div>
                 </div>
             </div>

             {/* Tracks */}
             {sequenceBlocks.length === 0 ? (
                 <div className="flex-1 flex items-center justify-center text-zinc-600 font-mono text-xs opacity-50 p-4">
                     NO TRACKS IN SEQUENCER
                 </div>
             ) : sequenceBlocks.map((block, i) => (
                 <div 
                    key={block.id} 
                    className={`flex border-b border-zinc-800/50 group hover:bg-zinc-800/30 transition-all duration-300 ease-in-out cursor-pointer z-0 relative ${expandedTracks[block.id] ? 'h-[336px]' : 'h-12'}`}
                    onDoubleClick={() => toggleTrackSize(block.id)}
                 >
                     {/* Track Header */}
                     <div className="w-48 bg-zinc-950/80 border-r border-zinc-800 flex flex-col justify-center px-2 text-[9px] sticky left-0 z-10">
                         <div className="flex justify-between items-center w-full">
                            <span className="font-bold text-indigo-400 capitalize truncate" title={block.name}>{block.name}</span>
                            <div className="flex gap-1 text-zinc-600">
                                <button className="hover:text-zinc-300 transition-colors">M</button>
                                <button className="hover:text-zinc-300 transition-colors">S</button>
                            </div>
                         </div>
                         <span className="text-[7px] text-zinc-600 mt-1 uppercase tracking-widest">{((block as any).type) || 'Standard Track'}</span>
                     </div>
                     {/* Track Content */}
                     <div className="flex-1 relative">
                          <div className={`absolute top-1 bottom-1 rounded border overflow-hidden bg-indigo-500/20 border-indigo-500/50 transition-all duration-300`}
                               style={{ left: `0%`, width: `100%` }}>
                               
                               {/* Waveform/Data visual inside block */}
                               <VolumetricDataVisualizer isActive={isPlaying} intensity={0.8} trackId={block.id} />
                               <div className="absolute text-[8px] text-indigo-300 p-1 opacity-90 truncate px-2 font-bold bg-indigo-900/40 rounded shadow-md mt-1 ml-1 backdrop-blur-sm z-10">{block.mediaRef || 'GENERATIVE BLOCK'}</div>
                          </div>
                     </div>
                 </div>
             ))}
             
             {/* Empty Space filler */}
             <div className="flex-1 border-t border-zinc-800/50"></div>
          </div>
          
          <div className="h-8 bg-zinc-950 border-t border-zinc-800 flex items-center px-4 justify-between text-[8px] text-zinc-500">
             <div className="flex gap-4">
                 <button className="hover:text-zinc-300 flex items-center gap-1"><Layers className="w-3 h-3"/> ADD TRACK</button>
                 <button className="hover:text-zinc-300">SNAP: GRID</button>
                 <button className="hover:text-zinc-300">QUANTIZE</button>
             </div>
             <div>
                 ZOOM: <input type="range" className="w-24 ml-2 align-middle accent-zinc-500" min="1" max="100" defaultValue="50" />
             </div>
          </div>
      </div>
    </div>
  );
};
