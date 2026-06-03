import React, { useState } from "react";
import { Piano, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { GoogleGenAI } from "@google/genai";
import { useGalleryStore } from "../services/galleryService";

export const Midi = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const galleryItems = useGalleryStore(state => state.items);
  const [isProcessing, setIsProcessing] = useState(false);

  const [channel, setChannel] = useState(1);
  
  const audioTracks = galleryItems.filter(item => item.type === 'audio');
  const availableGenerators = [
      "Arpeggiator Preset", 
      "Chord Generator", 
      "Euclidean Rhythm",
      ...audioTracks.map(t => `Extract from: ${t.title}`)
  ];
  
  const [selectedGenerator, setSelectedGenerator] = useState(availableGenerators[0]);
  const [notes, setNotes] = useState<{top: number, left: number, w: number}[]>([
      {top: 120, left: 50, w: 100},
      {top: 210, left: 50, w: 50},
      {top: 270, left: 50, w: 150},
      {top: 90, left: 200, w: 100},
      {top: 180, left: 200, w: 100}
  ]);

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Transmitting...", { description: `Sending ${selectedGenerator} data to output device` });
    
    // Generate new notes layout based on preset via proxy
    try {
      const response = await fetch("/api/generate-text", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
             prompt: `Generate a JSON array of 5 to 12 MIDI note objects based on the style "${selectedGenerator}". Each object should have properties: "top" (integer between 0 and 360, representing pitch), "left" (integer between 0 and 500, representing time), "w" (integer between 30 and 200, representing duration). Return ONLY the raw JSON array string.`,
             model: "gemini-2.5-flash"
         })
      });

      if (response.ok) {
         const data = await response.json();
         const cleanText = data.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "";
         const parsedNotes = JSON.parse(cleanText);
         if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
             setNotes(parsedNotes);
         }
      }
    } catch (e) {
      console.error("MIDI gen failed", e);
    }

    try {
      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "Midi",
        config: { generator: selectedGenerator, channel }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `MIDI seq active`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      const configObj = { generator: selectedGenerator, channel };

      useAppStore.getState().addSequenceBlock({
        id: `midi_seq_${Date.now()}`,
        name: `MIDI Stream CH${channel} (${selectedGenerator})`,
        loopCount: 4,
        volume: 0,
        fx: [],
        metadata: { configObj, notes }
      });
      addGalleryItem({
         title: `MIDI Preset (${selectedGenerator})`,
         type: "preset",
         url: `data:application/json;base64,${btoa(JSON.stringify(configObj))}`,
         format: "json",
         tags: ["midi", "preset", selectedGenerator.toLowerCase()],
         albums: [],
         metadata: configObj,
         sourcePageId: "midi"
      });
      
      toast.success("Sequencer Active", { description: "MIDI injected to loop and Global Gallery." });
    } catch (e) {
      toast.error("Transmission Failed");
      useAppStore.getState().addSystemLog(`error: MIDI transmission failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Piano, { className: "w-4 h-4" })} MIDI Editor
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
        {JSON.stringify({ component: "MIDI Editor", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]">MIDI Sequencer</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Protocol Matrix & Piano Roll</p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <div className="w-full lg:w-48 flex flex-col gap-4">
           {/* Tracks List */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col flex-1 min-h-[300px]">
             <div className="text-xs text-zinc-400 font-bold p-4 pb-2 border-b border-zinc-800">MIDI TRACKS</div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2">
                {["Lead Synth", "Bassline", "Drum Machine", "String Pad"].map((trk, i) => (
                  <div key={trk} className={`p-2 rounded text-[10px] cursor-pointer flex justify-between items-center ${i === 0 ? 'bg-indigo-900/40 border border-indigo-500 text-indigo-300' : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
                    <span>TRK {i+1} : {trk}</span>
                    {i === 0 && <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_5px_#6366f1] animate-pulse"></span>}
                  </div>
                ))}
             </div>
             <div className="p-2 border-t border-zinc-800">
               <button className="w-full bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 text-[10px] p-2 rounded transition-colors">+ NEW MIDI TRACK</button>
             </div>
           </div>
        </div>

        <div className="w-full lg:w-64 flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-2">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">I/O ROUTING</div>
             <div className="space-y-4">
               <div>
                 <div className="text-[10px] text-zinc-500 mb-1">INPUT DEVICE</div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer">
                   <option>ALL INS</option>
                   <option>Akai MPK Mini</option>
                   <option>Virtual MIDI Keyboard</option>
                 </select>
               </div>
               
               <div>
                 <div className="text-[10px] text-zinc-500 mb-1">OUTPUT DEVICE</div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer">
                   <option>Serum (VST3)</option>
                   <option>Ableton Link</option>
                   <option>Hardware Synth C</option>
                 </select>
               </div>

               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>MIDI CHANNEL</span>
                   <span className="text-indigo-400 font-mono">CH {channel}</span>
                 </div>
                 <input type="range" className="w-full accent-indigo-500" min="1" max="16" value={channel} onChange={(e) => setChannel(parseInt(e.target.value))} />
               </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">GENERATOR PRESETS</div>
             <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                 {availableGenerators.map(gen => (
                   <button 
                     key={gen}
                     onClick={() => setSelectedGenerator(gen)}
                     className={`w-full text-left bg-zinc-950 border ${
                       selectedGenerator === gen ? 'border-indigo-500 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'border-zinc-800 hover:border-indigo-500/50 text-zinc-400 hover:text-indigo-400'
                     } text-xs p-2 rounded transition-colors break-words`}
                   >
                     {gen}
                   </button>
                 ))}
             </div>
             
             <button onClick={handleGenerate} disabled={isProcessing} className="w-full mt-6 bg-indigo-900/40 border border-indigo-500/50 hover:bg-indigo-800/60 text-indigo-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isProcessing ? "TRANSMITTING..." : <><Play className="w-4 h-4 fill-indigo-200" /> SEND MIDI DATA</>}
             </button>
             <button onClick={() => {
                 toast.info("Updating generation matrix", { description: "Applying MIDI mapping to Music Gen Engine" });
                 useAppStore.getState().addSystemLog(`info: Re-rendering Music Generation via MIDI transformations.`, "info");
                 setTimeout(() => toast.success("Track Updated via MIDI"), 1500);
             }} className="w-full mt-2 bg-zinc-900 border border-zinc-700/50 hover:bg-zinc-800/60 text-indigo-400 px-2 py-2 rounded-md text-[9px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
                APPLY MIDI TO MUSIC GEN
             </button>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col flex-1 h-full overflow-hidden">
           <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
               <div className="flex gap-4 items-center">
                   <div className="flex bg-zinc-950 rounded border border-zinc-800 text-[10px] text-zinc-400 divide-x divide-zinc-800">
                       <button className="px-3 py-1 hover:bg-zinc-800 rounded-l">1/4</button>
                       <button className="px-3 py-1 bg-indigo-500/20 text-indigo-400">1/8</button>
                       <button className="px-3 py-1 hover:bg-zinc-800">1/16</button>
                       <button className="px-3 py-1 hover:bg-zinc-800 rounded-r">1/32</button>
                   </div>
                   <div className="text-[10px] text-zinc-500">BPM: 128</div>
               </div>
           </div>

           <div className="flex-1 flex overflow-auto relative custom-scrollbar bg-black outline-none" tabIndex={0}>
               {/* Piano Keys */}
               <div className="sticky left-0 w-16 z-20 flex flex-col bg-zinc-900 border-r border-zinc-800">
                   {["C5", "B4", "A#4", "A4", "G#4", "G4", "F#4", "F4", "E4", "D#4", "D4", "C#4", "C4"].map((note, i) => {
                       const isBlack = note.includes('#');
                       return (
                           <div key={note} className={`flex-1 min-h-[30px] border-b border-zinc-800 flex items-center justify-end pr-2 text-[10px] ${isBlack ? 'bg-zinc-950 text-zinc-600' : 'bg-zinc-200 text-zinc-800'}`}>
                               {note}
                           </div>
                       )
                   })}
               </div>

               {/* Grid */}
               <div className="flex-1 relative min-w-[800px] h-full" style={{ backgroundImage: 'linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)', backgroundSize: '50px 30px' }}>
                   
                   {/* Notes */}
                   {notes.map((n, i) => (
                      <div key={i} className="absolute h-[30px] bg-indigo-500/80 border border-indigo-400 rounded-sm shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300" style={{top: n.top, left: n.left, width: n.w}}></div>
                   ))}

                   {/* Playhead */}
                   {isProcessing && (
                     <div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#fff] z-10 animate-[progress_2s_linear_infinite]"></div>
                   )}
               </div>
           </div>
           
           <div className="h-24 bg-zinc-950 border-t border-zinc-800 p-2 relative">
               <div className="text-[10px] text-zinc-600 mb-1">VELOCITY</div>
               <div className="absolute left-16 right-0 bottom-2 top-6 flex items-end ml-4 gap-[50px]">
                   <div className="w-1 bg-indigo-500 h-[80%] rounded-t"></div>
                   <div className="w-1 bg-indigo-500 h-[60%] rounded-t ml-[46px]"></div>
                   <div className="w-1 bg-indigo-500 h-[40%] rounded-t ml-[46px]"></div>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};
