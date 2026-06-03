import { proxyGenerateText } from "../services/geminiService";
import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Settings, Layers, Volume2, Maximize2, Plus, Sparkles, X, SlidersHorizontal, Mic2 } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { toast } from "sonner";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { generateProceduralAudio } from "../services/audioService";
import { useGalleryStore } from "../services/galleryService";
import { VolumetricDataVisualizer } from './visualizers/VolumetricDataVisualizer';

const AudioTrack = ({ src, isPlaying, volume, fx }: { src: string, isPlaying: boolean, volume: number, fx?: string[] }) => {
   const audioRef = useRef<HTMLAudioElement>(null);
   
   useEffect(() => {
     if (audioRef.current) {
         audioRef.current.volume = volume;
         if (fx) {
             const rateFx = fx.find(f => f.startsWith("playbackRate:"));
             if (rateFx) {
                 audioRef.current.playbackRate = parseFloat(rateFx.split(":")[1]) || 1;
             }
         }
     }
   }, [volume, fx]);

   useEffect(() => {
     if (audioRef.current) {
        if (isPlaying) {
            audioRef.current.play().catch(e => console.log("Auto-play prevented", e));
        } else {
            audioRef.current.pause();
        }
     }
   }, [isPlaying]);

   return <audio ref={audioRef} src={src} loop />;
};

const VideoTrack = ({ mediaUrl, isPlaying, blockId }: { mediaUrl: string, isPlaying: boolean, blockId: string }) => {
   const videoRef = useRef<HTMLVideoElement>(null);
   
   useEffect(() => {
     if (videoRef.current) {
        if (isPlaying) {
            videoRef.current.play().catch(e => console.log("Auto-play prevented", e));
        } else {
            videoRef.current.pause();
        }
     }
   }, [isPlaying]);

   const handleCanPlay = () => {
      if (isPlaying && videoRef.current) {
          videoRef.current.play().catch(e => console.log("Auto-play prevented after load", e));
      }
   };

   return (
       <video 
          ref={videoRef}
          key={`vid_${blockId}`}
          src={mediaUrl}
          loop
          className={`absolute inset-0 w-full h-full object-cover ${isPlaying ? 'opacity-100' : 'opacity-40'} transition-opacity`}
          muted
          playsInline
          onCanPlay={handleCanPlay}
       />
   );
};

export const LoopPlayer = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const sequenceBlocks = useAppStore(state => state.sequenceBlocks);
  const mediaCache = useAppStore(state => state.mediaCache);
  const setMediaCache = useAppStore((state) => state.setMediaCache);
  const addSequenceBlock = useAppStore(state => state.addSequenceBlock);
  const updateSequenceBlock = useAppStore(state => state.updateSequenceBlock);
  const addSystemLog = useAppStore(state => state.addSystemLog);
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  
  const isPlaying = useAppStore(state => state.isPlaying);
  const setIsPlaying = useAppStore(state => state.setIsPlaying);
  const playhead = useAppStore(state => state.playhead);

  const globalBpm = useAppStore(state => state.globalBpm);
  const setGlobalBpm = useAppStore(state => state.setGlobalBpm);
  const [activePanel, setActivePanel] = useState<"fx" | "volume" | "settings" | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const togglePlayback = async () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    toast.success(nextState ? "Playback Started" : "Playback Paused", { description: "Event captured by XMAP edge routers" });
    addSystemLog(`loop_event: Orchestrator engine playback state changed to ${nextState ? 'PLAY' : 'PAUSE'}`);
    
    const req = buildPow3rRequest("UPDATE_PARAMETER", { target: "LoopPlayer", status: nextState ? "playing" : "paused" });
    const res = await executePow3rWorkflow(req, async () => {
      return { msg: "Workflow Timeline sync active" };
    });
    appendLogs(res);
  };

  const handleGenerateTrack = async () => {
    setIsGenerating(true);
    addSystemLog(`system: Initializing multi-modal generative track infusion...`);
    toast.info("Generating New Track Layer...", { description: "Executing via Pow3r Generative Model" });

    try {
      const currentContext = sequenceBlocks.map(b => b.name).join(", ");
      
      let newType = "Procedural Bass";
      try {
          const geminiResponse = await proxyGenerateText(`Given the existing music track layers: [${currentContext || "None"}], suggest exactly 1 short name for a cool new cohesive layer to add (e.g., 'Arp Synth', '808 Bass', 'Atmosphere'). Be creative but very brief (max 3 words). Do not include quotes or surrounding text.`);
          newType = geminiResponse.trim() || "Procedural Seq";
      } catch (e) {
          // ignore
      }

      // Generate a backing audio layer via procedural engine so it actually sounds like something
      const audioUrl = await generateProceduralAudio(globalBpm, 16); // 16 seconds loop
      const mediaRefId = `auto_layer_${Date.now()}`;
      setMediaCache(mediaRefId, audioUrl);

      const req = buildPow3rRequest("INFER_GENERATIVE_TRACK", {
        context: "New immersive loop addition",
      });
      const res = await executePow3rWorkflow(req, async () => {
        return {
          msg: `Infused new layer: ${newType}`,
          data: { type: newType }
        };
      });
      
      appendLogs(res);
      
      const newBlock = {
        id: `sb_gen_${Date.now()}`,
        name: newType,
        loopCount: 4,
        volume: 75,
        fx: [],
        mediaRef: mediaRefId
      };
      
      addSequenceBlock(newBlock);
      
      addGalleryItem({
         title: `Procedural (${newType})`,
         type: "audio",
         url: audioUrl,
         format: "wav",
         tags: ["procedural", "loop", newType],
         albums: [],
         metadata: { template: newType, bpm: globalBpm },
         sourcePageId: "music"
      });
      
      toast.success("Track Layer Infused", { description: `${newBlock.name} added to sequence and Global Gallery.` });
    } catch (e: any) {
      toast.error("Generation Failed");
      addSystemLog(`error: Generation failed: ${e.message || String(e)}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          <Play className="w-4 h-4" /> Loop Player
        </div>
        <div className="text-[10px] text-indigo-300">Pow3r Timeline Orchestrator</div>
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
        {JSON.stringify({ component: "Loop Player", engine: "Pow3r", ready: true, status: isPlaying ? "playing" : "paused" }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950/80 font-sans p-4 relative">
       {/* Top Header Controls */}
       <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4 shrink-0">
          <div className="flex items-center gap-4">
             <button 
               onClick={togglePlayback}
               className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.4)] ${isPlaying ? 'bg-indigo-600 text-white shadow-indigo-500' : 'bg-zinc-800 text-indigo-400 border border-indigo-500/50 hover:bg-zinc-700'}`}
             >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
             </button>
             <div className="flex flex-col">
               <span className="text-xl font-bold font-mono text-indigo-300 tracking-widest uppercase">Loop Runtime</span>
               <span className="text-[10px] text-indigo-500 font-bold font-mono uppercase tracking-[0.3em]">Timeline Engine</span>
             </div>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={() => {
                   const state = useAppStore.getState();
                   state.setIsPipOpen(!state.isPipOpen);
                }}
                className={`p-2 rounded border transition-colors bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-indigo-400`}
                title="Pop out Player"
              >
                  <Maximize2 className="w-4 h-4"/>
              </button>
             <button 
                onClick={() => setActivePanel(activePanel === "fx" ? null : "fx")}
                className={`p-2 rounded border transition-colors ${activePanel === "fx" ? "bg-indigo-900/50 border-indigo-500 text-indigo-400" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-indigo-400"}`}
              >
                  <Layers className="w-4 h-4"/>
              </button>
             <button 
                onClick={() => setActivePanel(activePanel === "volume" ? null : "volume")}
                className={`p-2 rounded border transition-colors ${activePanel === "volume" ? "bg-indigo-900/50 border-indigo-500 text-indigo-400" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-indigo-400"}`}
              >
                  <Volume2 className="w-4 h-4"/>
              </button>
             <button 
                onClick={() => setActivePanel(activePanel === "settings" ? null : "settings")}
                className={`p-2 rounded border transition-colors ${activePanel === "settings" ? "bg-indigo-900/50 border-indigo-500 text-indigo-400" : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-indigo-400"}`}
              >
                  <Settings className="w-4 h-4"/>
              </button>
          </div>
       </div>

       {/* Popover Panes */}
       {activePanel && (
           <div className="absolute top-[80px] right-4 w-64 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-lg p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-zinc-300 font-mono tracking-wider">
                      {activePanel === "fx" && "FX Routing"}
                      {activePanel === "volume" && "Track Volume Mix"}
                      {activePanel === "settings" && "Global Config"}
                  </span>
                  <button onClick={() => setActivePanel(null)} className="text-zinc-500 hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>

              {activePanel === "volume" && (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {sequenceBlocks.length === 0 && <span className="text-xs text-zinc-600 block text-center">No tracks loaded</span>}
                      {sequenceBlocks.map((b, i) => (
                           <div key={b.id} className="space-y-1">
                               <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                                  <span className="truncate max-w-[120px]">{i+1}: {b.name}</span>
                                  <span>{b.volume ?? 75}%</span>
                               </div>
                               <input 
                                  type="range" 
                                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
                                  value={b.volume ?? 75} 
                                  onChange={(e) => {
                                      updateSequenceBlock(b.id, { volume: parseInt(e.target.value) });
                                  }}
                                  onMouseUp={(e) => {
                                      addSystemLog(`loop_event: TRK ${i+1} volume set to ${(e.target as HTMLInputElement).value}%`);
                                  }}
                               />
                           </div>
                      ))}
                  </div>
              )}

              {activePanel === "fx" && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {sequenceBlocks.length === 0 && <span className="text-xs text-zinc-600 block text-center">No tracks loaded</span>}
                      {sequenceBlocks.map((b, i) => (
                          <div key={`fx_${b.id}`} className="space-y-1 bg-zinc-950 p-2 rounded border border-zinc-800">
                              <span className="text-[9px] text-indigo-400 font-bold block mb-1 font-mono">CH {i+1}: {b.name}</span>
                              <button 
                                  onClick={() => {
                                      const currentFx = b.fx || [];
                                      const hasReverb = currentFx.includes("Reverb");
                                      updateSequenceBlock(b.id, { fx: hasReverb ? currentFx.filter(f => f !== "Reverb") : [...currentFx, "Reverb"] });
                                      addSystemLog(`loop_event: TRK ${i+1} Reverb ${hasReverb ? 'disabled' : 'enabled'}`);
                                  }}
                                  className={`w-full p-2 text-[10px] uppercase font-bold text-left rounded flex items-center justify-between transition-colors ${b.fx?.includes("Reverb") ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
                              >
                                  Room Reverb <SlidersHorizontal className="w-3 h-3" />
                              </button>
                               <button 
                                  onClick={() => {
                                      const currentFx = b.fx || [];
                                      const hasDelay = currentFx.includes("Delay");
                                      updateSequenceBlock(b.id, { fx: hasDelay ? currentFx.filter(f => f !== "Delay") : [...currentFx, "Delay"] });
                                      addSystemLog(`loop_event: TRK ${i+1} Delay ${hasDelay ? 'disabled' : 'enabled'}`);
                                  }}
                                  className={`w-full p-2 text-[10px] uppercase font-bold text-left rounded flex items-center justify-between transition-colors ${b.fx?.includes("Delay") ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'}`}
                              >
                                  Delay FX <SlidersHorizontal className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                  </div>
              )}

              {activePanel === "settings" && (
                  <div className="space-y-4">
                      <div>
                         <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mb-1">
                             <span>MASTER TEMPO</span>
                             <span className="text-indigo-400">{globalBpm} BPM</span>
                         </div>
                         <input type="range" className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" min="60" max="200" value={globalBpm} onChange={(e) => setGlobalBpm(parseInt(e.target.value))} />
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-400">SNAP QUANTIZE</span>
                          <select className="bg-zinc-950 border border-zinc-700 text-indigo-300 rounded focus:outline-none p-1">
                              <option>1/16 Note</option>
                              <option>1/8 Note</option>
                              <option>1/4 Note</option>
                              <option>Off</option>
                          </select>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-400">PLAY MODE</span>
                          <select className="bg-zinc-950 border border-zinc-700 text-indigo-300 rounded focus:outline-none p-1">
                              <option>Cycle</option>
                              <option>One-Shot</option>
                              <option>Pendulum</option>
                          </select>
                      </div>
                  </div>
              )}
           </div>
       )}

       {/* Main Player Area: Stage + Timeline */}
       <div className="flex-1 flex flex-col min-h-0 gap-4 mt-2">
           
           {/* Visual Stage & Preview Monitor */}
           <div className="h-1/3 min-h-[150px] bg-[#050510] shadow-[inset_0_0_50px_rgba(0,0,0,1)] border border-zinc-800 rounded-lg relative overflow-hidden flex items-center justify-center group">
              {sequenceBlocks.length === 0 && (
                 <div className="text-zinc-600 font-mono text-xs opacity-50 flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" /> SILENT STAGE
                 </div>
              )}
              {isPlaying && <div className="absolute inset-0 bg-indigo-500/5 mix-blend-screen animate-pulse pointer-events-none z-10" />}
              
              {/* Combine playing tracks contextually */}
              {sequenceBlocks.map(block => {
                 const mediaUrl = block.mediaRef ? mediaCache[block.mediaRef] : null;

                 if (mediaUrl && mediaUrl.startsWith("blob:") && !block.mediaRef?.toLowerCase().includes("video") && !block.mediaRef?.toLowerCase().includes("image")) {
                     // Need invisible HTML5 audio for playback
                     return (
                         <AudioTrack 
                           key={`audio_src_${block.id}`}
                           src={mediaUrl} 
                           isPlaying={isPlaying}
                           volume={(block.volume ?? 75) / 100}
                           fx={block.fx}
                         />
                     );
                 }

                 if (mediaUrl && block.mediaRef?.toLowerCase().includes("video")) {
                    return (
                        <VideoTrack 
                           key={`vid_${block.id}`}
                           blockId={block.id}
                           mediaUrl={mediaUrl}
                           isPlaying={isPlaying}
                        />
                    );
                 }
                 if (mediaUrl && block.mediaRef?.toLowerCase().includes("image")) {
                    return (
                        <img 
                           key={`img_${block.id}`}
                           src={mediaUrl}
                           alt="Track Visual"
                           className={`absolute inset-0 w-full h-full object-cover ${isPlaying ? 'opacity-100' : 'opacity-20'} transition-opacity delay-75`}
                        />
                    );
                 }
                 return null;
              })}
              
              {/* Overlay Activity HUD for all tracks */}
              {isPlaying && (
                 <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 items-end">
                    {sequenceBlocks.map(block => {
                       const t = block.name.toLowerCase();
                       let Icon = null;
                       let color = "text-indigo-400";
                       let prefix = "🎶";
                       if (t.includes("voice") || t.includes("tts") || t.includes("narrat")) prefix = "🎙️";
                       if (t.includes("sfx") || t.includes("laser") || t.includes("beam")) prefix = "⚡";
                       if (t.includes("light") || t.includes("dmx")) prefix = "💡";

                       return (
                         <div key={block.id} className="text-[9px] font-mono text-zinc-300 font-bold bg-black/60 px-2 py-1 rounded backdrop-blur-md animate-pulse flex items-center gap-2 border border-zinc-700/50">
                             {prefix} <span className="opacity-80 truncate max-w-[120px]">{block.name}</span>
                         </div>
                       );
                    })}
                 </div>
              )}
              
              {/* Overlay graphic representation for audio if playing */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-90 z-0">
                 {sequenceBlocks.length > 0 && (
                    <VolumetricDataVisualizer isActive={isPlaying} intensity={isPlaying ? 1.5 : 0.05} trackId="master" />
                 )}
              </div>
              
              <div className="absolute top-3 left-3 px-2 py-1 bg-zinc-950/80 border border-zinc-800 text-[9px] font-bold text-zinc-500 uppercase rounded z-20 font-mono tracking-widest hidden group-hover:block">
                 VISUAL PREVIEW
              </div>

               {/* Agents Interface in Runtime */}
               {sequenceBlocks.filter(b => b.name.toLowerCase().includes("agent")).map((agentBlock, idx) => (
                  <div key={idx} className="absolute bottom-4 left-4 z-50 bg-black/80 backdrop-blur-md rounded-lg border border-indigo-500/30 p-3 w-72 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                     <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                         <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                             <span className="text-[10px] font-mono text-indigo-300 font-bold tracking-widest uppercase">{agentBlock.name}</span>
                         </div>
                         <div className="text-[8px] text-zinc-500 font-mono">T:{agentBlock.metadata?.temperature || 0.7}</div>
                     </div>
                     <div className="text-[10px] text-zinc-400 font-mono h-24 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {isPlaying ? (
                          <>
                            <div className="text-indigo-400/80 border-l-2 border-indigo-500/50 pl-2 ml-1 leading-tight text-xs shadow-sm bg-indigo-900/10 p-1 rounded-r">
                               {agentBlock.metadata?.directive ? `>> ${agentBlock.metadata.directive.substring(0, 100)}...` : '>> Observing scene...'}
                            </div>
                            <div className="text-green-400/80 animate-in fade-in slide-in-from-bottom border-l-2 border-green-500/50 pl-2 ml-1 whitespace-pre-wrap leading-tight h-full overflow-hidden text-[9px]" style={{ animationDelay: "1s" }}>
                               {agentBlock.metadata?.generatedPlan || "Running autonomous mix optimization..."}
                            </div>
                          </>
                        ) : (
                          <div className="text-zinc-600 italic border-l-2 border-zinc-700 pl-2 ml-1 p-1">Standing by... waiting for playback hook</div>
                        )}
                     </div>
                  </div>
               ))}
           </div>

           {/* Timeline Matrix */}
           <div className="flex-1 overflow-hidden flex flex-col relative bg-[#0a0a0a] border border-zinc-800 rounded-lg">
              {/* Rulers */}
              <div className="h-6 bg-zinc-900 border-b border-zinc-800 flex items-center relative opacity-60 pointer-events-none px-4">
                 <div className="w-[120px] shrink-0 border-r border-zinc-700 h-full"></div>
                 <div className="flex-1 flex items-center h-full relative">
                    {[...Array(20)].map((_, i) => (
                       <div key={i} className="flex-1 border-l border-zinc-700 h-2" />
                    ))}
                    <div className="absolute top-0 bottom-0 w-[2px] bg-indigo-500 shadow-[0_0_10px_#6366f1] z-50 transition-all duration-75" style={{ left: `${playhead}%` }} />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                 <div className="flex h-full min-h-min p-4 gap-4">
                     
                     {/* Tracks List */}
                     <div className="flex-1 flex flex-col gap-2 relative">
                         {sequenceBlocks.map((block, idx) => {
                            return (
                             <div key={block.id} className="h-[60px] bg-zinc-900/60 border border-zinc-800/80 rounded flex relative group overflow-hidden transition-all hover:bg-zinc-800/40">
                                
                                {/* Track Header */}
                                <div className="w-[120px] bg-zinc-950 border-r border-zinc-800 p-2 shrink-0 flex flex-col justify-center z-30 relative shadow-xl">
                                   <div className="flex justify-between items-center mb-1">
                                      <span className="text-[9px] text-zinc-500 font-bold font-mono">CH {idx + 1}</span>
                                      <button onClick={() => updateSequenceBlock(block.id, { volume: block.volume === 0 ? 75 : 0 })} className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold ${block.volume === 0 ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}>M</button>
                                   </div>
                                   <span className="text-[11px] text-indigo-300 font-bold truncate pr-2">{block.name}</span>
                                </div>
                               {/* Track Timeline Area */}
                               <div className="flex-1 relative flex items-center px-1 overflow-hidden">
                                  <div className="absolute inset-0 z-0 bg-[linear-gradient(90deg,transparent_24px,#ffffff03_25px)] bg-[size:25px_100%]" />
                                  
                                  {/* Clip Block */}
                                  <div className="h-[44px] bg-indigo-500/20 border border-indigo-500/40 rounded flex items-center justify-between px-3 z-10 hover:bg-indigo-500/30 cursor-pointer transition-colors shadow-inner relative overflow-hidden" style={{ width: `${Math.min(100, Math.max(20, block.loopCount * 15))}%` }}>
                                     <div className="absolute inset-0 flex items-center opacity-30 gap-[1px]">
                                        {[...Array(30)].map((_, i) => (
                                           <div key={i} className="flex-1 bg-indigo-400" style={{ height: `${Math.random() * 80 + 20}%`}}></div>
                                        ))}
                                     </div>
                                     <span className="text-[9px] text-indigo-100 font-bold flex items-center gap-2 z-10 font-mono drop-shadow-md">
                                         <span className="bg-indigo-600 px-1 rounded text-white">x{block.loopCount}</span>
                                         {block.mediaRef ? 'AUDIO CLIP' : 'GENERATIVE PATTERN'}
                                     </span>
                                  </div>
                               </div>
                            </div>
                          );
                         })}

                         {/* Generative Layer Append */}
                         <button 
                             disabled={isGenerating}
                             onClick={handleGenerateTrack}
                             className={`w-full h-[60px] bg-indigo-950/20 border border-dashed border-indigo-500/40 rounded flex flex-col items-center justify-center transition-all shadow-[inset_0_0_15px_rgba(99,102,241,0.05)] ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'opacity-70 hover:opacity-100 hover:bg-indigo-950/40 cursor-pointer hover:shadow-[inset_0_0_20px_rgba(99,102,241,0.15)]'}`}
                         >
                            {isGenerating ? (
                                <span className="text-[11px] text-indigo-400 tracking-widest font-mono uppercase font-bold animate-pulse flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-spin" /> SYNTHESIZING PROCEDURAL LAYER...
                                </span>
                            ) : (
                                <span className="text-[11px] text-indigo-400 tracking-widest font-mono uppercase font-bold flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> ADD PROCEDURAL LAYER
                                </span>
                            )}
                         </button>
                     </div>
                 </div>
              </div>
           </div>
        </div>
    </div>
  );
};
