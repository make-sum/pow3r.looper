import React, { useState } from "react";
import { HorizontalPanelDef } from "../../config/matrixSchema";
import { LayoutGrid, List, Settings2, History, Sliders, Box, Save, Plus, Play, Pause, X } from "lucide-react";
import { format } from "date-fns";
import GalleryBucket from "../GalleryBucket";

export const DynamicPanelRenderer: React.FC<{ pDef: HorizontalPanelDef }> = ({ pDef }) => {
  const [activeTab, setActiveTab] = useState("all");

  switch (pDef.type) {
    case "presets":
      return (
        <div className="grid grid-cols-2 gap-3 lg:gap-4 overflow-y-auto custom-scrollbar pr-2 pb-20">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <button key={i} className="bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-cyan-500/50 rounded-xl p-4 text-left transition-all group flex flex-col justify-between h-32 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-5 h-5 text-cyan-400 fill-cyan-400" />
               </div>
               <div>
                  <h3 className="text-zinc-300 font-bold font-sans text-sm mb-1">{pDef.title} {i}</h3>
                  <p className="text-zinc-600 font-mono text-[10px] uppercase">Variant 0{i}</p>
               </div>
               <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500/50"></span>
                  <span className="w-2 h-2 rounded-full bg-neon-pink/50"></span>
               </div>
            </button>
          ))}
          <button className="bg-zinc-900/20 hover:bg-zinc-800/50 border border-dashed border-zinc-800 hover:border-cyan-500/50 rounded-xl p-4 text-center transition-all flex flex-col items-center justify-center h-32 text-zinc-500 hover:text-cyan-400 gap-2">
            <Plus className="w-6 h-6" />
            <span className="font-mono text-xs uppercase">New Preset</span>
          </button>
        </div>
      );

    case "gallery":
      return (
        <div className="h-full">
           <GalleryBucket pageId={pDef.title.toLowerCase().replace(/\s+/g, '-')} panel="left" />
        </div>
      );

    case "history":
      return (
        <div className="flex flex-col gap-0 overflow-y-auto custom-scrollbar pr-2 pb-20 relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-800" />
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} className="flex gap-4 p-4 hover:bg-zinc-900/50 rounded-lg transition-colors relative z-10">
               <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-700 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4 text-cyan-500" />
               </div>
               <div className="flex flex-col">
                 <span className="text-zinc-300 font-sans text-sm font-medium">Revision Update v1.0.{8-i}</span>
                 <span className="text-zinc-500 font-mono text-[10px] uppercase mt-1">Author: SYS_ADMIN</span>
                 <span className="text-zinc-600 font-mono text-[10px] mt-0.5">{format(new Date(Date.now() - i * 86400000), "yyyy-MM-dd HH:mm:ss")}</span>
               </div>
               <button className="ml-auto text-zinc-500 hover:text-cyan-400 px-3 py-1 font-mono text-xs h-fit border border-transparent hover:border-cyan-500/50 rounded">Revert</button>
            </div>
          ))}
        </div>
      );

    case "settings":
      return (
        <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-20">
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-zinc-300 font-mono text-xs uppercase tracking-widest border-b border-zinc-800 pb-2">Global Parameters</h3>
              <div className="flex flex-col gap-2">
                 <label className="text-zinc-500 text-[10px] uppercase">Intensity Mapping</label>
                 <input type="range" className="w-full accent-cyan-500" />
              </div>
              <div className="flex flex-col gap-2 mt-2">
                 <label className="text-zinc-500 text-[10px] uppercase">Sync Tolerance (ms)</label>
                 <input type="number" className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-300 text-sm font-mono" defaultValue={25} />
              </div>
           </div>
           
           <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-zinc-300 font-mono text-xs uppercase tracking-widest border-b border-zinc-800 pb-2">Hardware Bindings</h3>
              <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                 <span className="text-zinc-400 font-mono text-sm">MIDI Input Device</span>
                 <span className="text-cyan-400 font-mono text-xs bg-cyan-900/30 px-2 py-1 rounded">CONNECTED</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                 <span className="text-zinc-400 font-mono text-sm">OSC Broadcast</span>
                 <div className="w-8 h-4 bg-zinc-800 rounded-full cursor-pointer relative">
                    <div className="absolute left-1 top-1 bottom-1 w-2 bg-zinc-500 rounded-full" />
                 </div>
              </div>
           </div>
        </div>
      );

    case "controls":
    case "misc":
    case "editor":
    default:
      return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 font-mono relative overflow-hidden bg-zinc-900/30 group">
           <Sliders className="w-8 h-8 mb-4 opacity-50 group-hover:text-cyan-400 group-hover:opacity-100 transition-colors" />
           <span className="text-xs uppercase tracking-widest text-zinc-400 mb-2">Workspace initialized</span>
           <span className="text-[10px] opacity-60">Ready for user input</span>
           <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <span className="text-[9px] uppercase px-2 py-1 rounded bg-zinc-800">Status: ACTIVE</span>
              <span className="text-[9px] uppercase px-2 py-1 rounded bg-zinc-800">{pDef.type}</span>
           </div>
        </div>
      );
  }
}
