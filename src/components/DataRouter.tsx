import React, { useState } from "react";
import { Network, Play, AlertTriangle, ArrowRight } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";

export const DataRouter = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);

  const triggerTransform = async () => {
    setIsProcessing(true);
    toast.info("Routing Data...", { description: "Processing and forwarding payload" });
    
    try {
      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "DataRouter",
        config: { action: "transform" }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Payload forwarded`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);
      toast.success("Routing Complete", { description: "Payload processed." });
    } catch (e) {
      toast.error("Routing Failed");
      useAppStore.getState().addSystemLog(`error: Data routing failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-yellow-400 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(250,204,21,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-yellow-400" />
        <div className="font-mono font-bold text-xs text-yellow-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2">
          Data Router
        </div>
        <div className="text-[10px] text-yellow-300">JSON Payload Transformer</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-yellow-400" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <octahedronGeometry args={[0.5]} />
        <meshStandardMaterial color="#facc15" wireframe />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-yellow-400 font-mono bg-zinc-950 p-4 border border-yellow-500/20 rounded">
        {JSON.stringify({ component: "DataRouter", operations: ["transform", "mutate_context"] }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">Data Router Configurator</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">JSON Transformer & Schema Translator</p>
        </div>
        <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] rounded animate-pulse">
          ROUTING: MESH
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col">
             <div className="text-xs text-yellow-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <span>INPUT SCHEMAS</span>
                   <button className="text-[8px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded hover:bg-yellow-500/40 border border-yellow-500/30 transition-colors">
                     INFER FROM EDGES
                   </button>
                 </div>
                 <span className="text-zinc-500">FORMAT: JSON</span>
             </div>
             <textarea 
               className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-zinc-300 text-[10px] focus:outline-none focus:border-yellow-500 resize-none font-mono"
               defaultValue={'{\n  "source": "AgentNode_01",\n  "context": {\n    "mood": "aggressive",\n    "intensity": 0.8\n  }\n}'}
             />
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col relative group">
             <div className="text-xs text-yellow-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
                 <div className="flex items-center gap-2">
                   <span>TRANSFORM RULES</span>
                   <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                     AUTO-COMPLETE ON
                   </span>
                 </div>
                 <span className="text-zinc-500">JQ SYNTAX</span>
             </div>
             <div className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-[10px] font-mono relative overflow-hidden focus-within:border-yellow-500">
               <textarea 
                 className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-yellow-400 p-3 resize-none focus:outline-none z-10"
                 defaultValue={'.context | { energy_level: .intensity, style: .mood, origin: $ENV.source }'}
                 spellCheck={false}
               />
               <div className="absolute inset-0 w-full h-full p-3 pointer-events-none z-0">
                  <span className="text-pink-400">.context</span> <span className="text-zinc-500">|</span> <span className="text-cyan-400">{'{'}</span> <span className="text-emerald-300">energy_level</span>: <span className="text-pink-400">.intensity</span>, <span className="text-emerald-300">style</span>: <span className="text-pink-400">.mood</span>, <span className="text-emerald-300">origin</span>: <span className="text-purple-400">$ENV</span>.<span className="text-zinc-300">source</span> <span className="text-cyan-400">{'}'}</span>
               </div>
             </div>
           </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-32 flex items-center justify-center flex-col gap-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-yellow-500/5 mix-blend-screen pointer-events-none"></div>
               <div className="flex items-center gap-4 w-full px-6">
                   <div className="w-16 h-12 bg-zinc-950 border border-yellow-500/50 rounded flex items-center justify-center text-yellow-500 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                       IN
                   </div>
                   <div className="flex-1 h-0.5 bg-gradient-to-r from-yellow-500/50 to-orange-500/50 relative overflow-hidden">
                       <div className="w-1/3 h-full bg-yellow-400 absolute left-0 shadow-[0_0_8px_#facc15] animate-[progress_1s_linear_infinite]" style={{ display: isProcessing ? 'block' : 'none' }}></div>
                   </div>
                   <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500 rounded-full flex items-center justify-center text-yellow-400">
                       <Network className={`w-6 h-6 ${isProcessing ? 'animate-spin' : ''}`} />
                   </div>
                   <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-500/50 to-emerald-500/50 relative overflow-hidden">
                       <div className="w-1/3 h-full bg-orange-400 absolute left-0 shadow-[0_0_8px_#fb923c] animate-[progress_1s_linear_infinite]" style={{ display: isProcessing ? 'block' : 'none', animationDelay: '0.5s' }}></div>
                   </div>
                   <div className="w-16 h-12 bg-zinc-950 border border-emerald-500/50 rounded flex items-center justify-center text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                       OUT
                   </div>
               </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col justify-between">
               <div className="flex-1 flex flex-col">
                   <div className="text-xs text-emerald-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
                       <span>OUTPUT PREVIEW</span>
                       <span className="text-zinc-500">FORMAT: JSON</span>
                   </div>
                   <pre className={`flex-1 w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-[10px] font-mono overflow-auto ${isProcessing ? 'text-zinc-500' : 'text-emerald-300'}`}>
{isProcessing ? 'PROCESSING...' : `{\n  "energy_level": 0.8,\n  "style": "aggressive",\n  "origin": "AgentNode_01"\n}`}
                   </pre>
               </div>
               
               <button onClick={triggerTransform} disabled={isProcessing} className="w-full mt-4 bg-yellow-900/40 border border-yellow-500/50 hover:bg-yellow-800/60 text-yellow-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isProcessing ? "TRANSFORMING..." : <><Play className="w-4 h-4 fill-yellow-200" /> EXECUTE TRANSFORM</>}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};

