import React, { useEffect, useState } from "react";
import { Layout, Play, AlertTriangle, MonitorPlay, Terminal } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useWorkflowStore } from "../store/useWorkflowStore";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";

export const ComponentFactory = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);

  useEffect(() => {
    setNodes(useWorkflowStore.getState().nodes);
    const unsub = useWorkflowStore.subscribe((state) => {
      setNodes(state.nodes);
    });
    return unsub;
  }, []);

  const triggerFactory = async () => {
    setIsProcessing(true);
    toast.info("Instancing...", { description: "Compiling node components" });
    
    try {
      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "ComponentFactory",
        config: { action: "sync_nodes", nodeCount: nodes.length }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Sync Complete`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);
      toast.success("Factory Sync", { description: "All active nodes instanced." });
    } catch (e) {
      toast.error("Factory Sync Failed");
      useAppStore.getState().addSystemLog(`error: ComponentFactory sync failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-cyan-400 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(34,211,238,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-cyan-400" />
        <div className="font-mono font-bold text-xs text-cyan-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2">
          Component Factory
        </div>
        <div className="text-[10px] text-cyan-300">Tracking {nodes.length} Components</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-cyan-400" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
        <meshStandardMaterial color="#22d3ee" wireframe />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-cyan-400 font-mono bg-zinc-950 p-4 border border-cyan-500/20 rounded h-full overflow-auto">
        {JSON.stringify({ component: "ComponentFactory", type: "Generator", tracking: nodes.length, nodes: nodes.map(n => n.id) }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">Component Factory</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">RaduxUI / Pow3r Generator Assembly</p>
        </div>
        <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] rounded animate-pulse">
          FACTORY: ONLINE (TRACKING {nodes.length} NODES)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full min-h-0">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col relative overflow-hidden">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
                 <span>ASSEMBLY LINE TELEMETRY</span>
                 <span className="text-cyan-500">LIVE FEED</span>
             </div>

             <div className="flex-1 overflow-auto custom-scrollbar pr-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                 {nodes.filter(n => n.id.includes('builder') || n.type?.includes('builder') || n.id.includes('Gen') || n.id.includes('xmap')).map((n, i) => {
                   const status = n.data?.plan?.devStatus || n.data?.status || 'complete';
                   const plan = n.data?.plan as any;
                   
                   return (
                     <div key={n.id} className="border border-cyan-500/30 rounded-lg bg-cyan-950/30 p-3 flex flex-col items-start relative group hover:bg-cyan-900/40 transition-colors">
                       <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none opacity-50">
                          <div className="absolute top-[-10px] right-[-10px] w-10 h-10 border border-cyan-500/50 rotate-45 group-hover:bg-cyan-500/10 transition-colors"></div>
                       </div>
                       
                       <div className="flex items-center justify-between w-full mb-2">
                         <div className="text-[10px] text-cyan-400 font-bold uppercase truncate max-w-[70%]">{n.id}</div>
                         <div className={`text-[8px] px-1.5 py-0.5 rounded uppercase ${status === 'complete' || status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'}`}>
                           {status}
                         </div>
                       </div>
                       <div className="text-[9px] text-cyan-300/70 mb-1 truncate w-full">TASK: {plan?.taskId || 'AUTO-GEN'}</div>
                       <div className="text-[8px] text-zinc-500 line-clamp-2 w-full">{plan?.goal || 'Inherited UI Component Generation Schema Active.'}</div>
                     </div>
                   )
                 })}
             </div>
           </div>
           
           <div className="h-48 bg-zinc-950 border border-cyan-500/30 rounded-xl flex flex-col relative overflow-hidden group">
               <div className="bg-cyan-900/20 border-b border-cyan-500/30 flex justify-between items-center px-3 py-1.5 backdrop-blur-md z-10">
                 <div className="flex items-center gap-2">
                   <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                   </div>
                   <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold font-mono px-2 py-0.5 rounded ml-2">
                      LIVE PREVIEW [SANDBOX]
                   </span>
                 </div>
                 <MonitorPlay className="w-4 h-4 text-cyan-500" />
               </div>
               
               <div className="flex-1 relative z-0 flex items-center justify-center bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzM3NDE1MSIvPjwvc3ZnPg==')]">
                  <div className="w-2/3 h-24 bg-zinc-900 border border-cyan-500/20 rounded-md shadow-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-500 relative">
                     <div className="absolute top-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                     <span className="text-cyan-400 font-sans font-medium text-xs tracking-wide">
                        Rendered Node Output
                     </span>
                  </div>
               </div>
           </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
                <span>SCHEMATICS</span>
             </div>
             
             <div className="space-y-4">
                 <div>
                     <div className="text-[10px] text-zinc-500 mb-1">UI FRAMEWORK</div>
                     <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-2 cursor-pointer">
                       <option>Pow3r UNBOUND (Radux)</option>
                       <option>Component Factory V2</option>
                       <option>Raw Tailwind</option>
                     </select>
                 </div>
                 
                 <div>
                     <div className="text-[10px] text-zinc-500 mb-1">AESTHETIC ENGINE</div>
                     <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-2 cursor-pointer">
                       <option>Neon Outline / Dash</option>
                       <option>Glassmorphism v4</option>
                       <option>Terminal / Brutalist</option>
                     </select>
                 </div>
             </div>
           </div>
           
           <div className="flex-1 bg-zinc-950 border border-cyan-500/30 rounded-xl flex flex-col relative overflow-hidden font-mono">
              <div className="bg-cyan-900/20 border-b border-cyan-500/30 px-3 py-1.5 flex justify-between items-center z-10 text-[10px]">
                 <span className="text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Terminal className="w-3 h-3" /> AST VISUALIZER
                 </span>
                 <span className="text-zinc-500">source.json</span>
              </div>
              <div className="flex-1 p-3 overflow-auto custom-scrollbar text-[10px] text-zinc-300 relative z-0">
                 <div className="space-y-1">
                    <div><span className="text-cyan-400">▼ root</span>: Program</div>
                    <div className="pl-4 border-l border-zinc-800"><span className="text-cyan-400">▼ body</span>: Array[2]</div>
                    <div className="pl-8 border-l border-zinc-800"><span className="text-purple-400">▼ 0</span>: ImportDeclaration</div>
                    <div className="pl-12 border-l border-zinc-800"><span className="text-pink-400">► source</span>: "react"</div>
                    <div className="pl-8 border-l border-zinc-800"><span className="text-purple-400">▼ 1</span>: ExportNamedDeclaration</div>
                    <div className="pl-12 border-l border-zinc-800"><span className="text-cyan-400">▼ declaration</span>: VariableDeclaration</div>
                    <div className="pl-16 border-l border-zinc-800"><span className="text-green-400">► declarations</span>: Array[1]</div>
                    <div className="pl-16 border-l border-zinc-800"><span className="text-zinc-500">kind</span>: "const"</div>
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950 pointer-events-none"></div>
              </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between shrink-0">
               <button onClick={triggerFactory} disabled={isProcessing} className="w-full bg-cyan-900/40 border border-cyan-500/50 hover:bg-cyan-800/60 text-cyan-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isProcessing ? "SYNCING..." : <><Layout className="w-4 h-4" /> SYNC COMPONENTS</>}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};
