import React, { useEffect, useState } from "react";
import { Activity, Plug, Route } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useWorkflowStore } from "../store/useWorkflowStore";

export const WFBuilder = ({ mode = "ui", data }: { mode?: "ui" | "3d" | "flow" | "json"; data?: any }) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState("All Active Nodes");

  useEffect(() => {
    // If not passed explicitly, grab from store
    if (!data) {
      setNodes(useWorkflowStore.getState().nodes);
      const unsub = useWorkflowStore.subscribe((state) => {
        setNodes(state.nodes);
      });
      return unsub;
    }
  }, [data]);

  const displayData = data || { nodes, goal: "project compliant to the Pow3r vision + Guardian policies + XMAP configuration + schema spec + Builder component requirements." };

  const workflows = [
    "All Active Nodes",
    "Agent Architecture Engine",
    "Spatial Computing Rig",
    "Neural Media Synthesis",
    "System Orchestration"
  ];

  const filteredNodes = selectedWorkflow === "All Active Nodes" 
    ? nodes 
    : nodes.filter(n => n.id.length % workflows.length === workflows.indexOf(selectedWorkflow));

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-emerald-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(16,185,129,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-emerald-500" />
        <div className="flex justify-between items-start mb-2 border-b border-zinc-800 pb-2">
          <div className="font-mono font-bold text-xs text-emerald-400 uppercase tracking-wider">
            {displayData?.name || "WF Builder"}
          </div>
          <div className="px-1.5 py-0.5 rounded text-[8px] font-mono border border-emerald-500 text-emerald-400 bg-emerald-500/10">Active</div>
        </div>
        <div className="text-[10px] font-mono text-emerald-300">
          Orchestrating workflow...
        </div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-emerald-500" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-emerald-400 font-mono bg-zinc-950 p-4 border border-emerald-500/20 rounded h-full overflow-auto break-all whitespace-pre-wrap">
        {JSON.stringify({ component: "WFBuilder", type: "Node", capabilities: ["workflow", "mcp"], scope: displayData }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex font-mono overflow-hidden h-full w-full p-4 md:p-8 gap-6">
       <div className="flex-1 flex flex-col items-center justify-center">
         <Activity className="w-16 h-16 text-emerald-400 drop-shadow-[0_0_20px_#10b981] mb-6 animate-pulse" />
         <div className="text-sm font-bold text-emerald-300 tracking-[0.2em] mb-4 text-center">WORKFLOW ORCHESTRATOR</div>
         <div className="text-xs text-emerald-500 max-w-2xl text-center border border-emerald-500/30 bg-emerald-900/10 p-4 rounded-xl mb-6">
           Visual API & MCP mapping node architecture loaded. Ready for Unbound Workflow injection.
         </div>
         <div className="w-full max-w-4xl bg-black border border-emerald-500/30 rounded-lg p-4 custom-scrollbar overflow-auto max-h-[30vh] text-left">
            <div className="text-emerald-400 font-bold mb-2">TARGET GOAL:</div>
            <div className="text-emerald-300/70 text-xs mb-6 whitespace-pre-wrap break-all">
               Ensure the exact plan execution logic dynamically structures workflows. Adjust scope below. 
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
              <div className="text-emerald-400 font-bold">SYSTEM NODES ({filteredNodes.length}):</div>
              <select 
                className="bg-emerald-900/40 text-emerald-300 border border-emerald-500/50 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-400"
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value)}
              >
                {workflows.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
              {filteredNodes.map(n => (
                <div key={n.id} className="p-2 border border-emerald-500/20 rounded bg-emerald-900/20 text-[10px] text-emerald-300 truncate">
                  <span className="opacity-50 hover:opacity-100">{n.id}</span>
                </div>
              ))}
            </div>
         </div>
       </div>
       
       <div className="w-[300px] shrink-0 border-l border-zinc-800 pl-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
           <div className="text-sm font-bold text-emerald-400 border-b border-zinc-800 pb-2 mb-2">ROUTING PROTOCOLS</div>
           
           <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-4 flex flex-col relative h-[140px]">
              <div className="flex justify-between items-center mb-3">
                 <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><Plug className="w-3 h-3"/> MCP HUB</span>
                 <span className="text-[8px] px-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded">ACTIVE</span>
              </div>
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto text-[9px] text-zinc-400 pr-1 custom-scrollbar">
                  <div className="flex justify-between items-center bg-black p-1 border border-zinc-800 rounded">
                      <span>Pow3r Unified</span> <span className="text-emerald-500">Connected</span>
                  </div>
                  <div className="flex justify-between items-center bg-black p-1 border border-zinc-800 rounded">
                      <span>XMAP Store</span> <span className="text-emerald-500">Connected</span>
                  </div>
                  <div className="flex justify-between items-center bg-black p-1 border border-zinc-800 rounded">
                      <span>Global Gallery</span> <span className="text-emerald-500">Connected</span>
                  </div>
              </div>
           </div>
           
           <div className="bg-zinc-900 border border-emerald-500/30 rounded-xl p-4 flex flex-col relative h-[140px]">
               <div className="flex justify-between items-center mb-3">
                 <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><Route className="w-3 h-3"/> API ROUTER</span>
                 <span className="text-[8px] px-1 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded">STANDBY</span>
              </div>
              <div className="flex-1 flex flex-col gap-2 justify-center pb-2">
                 <div className="h-1.5 w-full bg-zinc-800 rounded relative overflow-hidden">
                     <div className="absolute top-0 bottom-0 left-0 bg-zinc-700 w-full"></div>
                 </div>
                 <div className="flex justify-between text-[8px] text-zinc-500 uppercase tracking-widest">
                     <span>WAITING FOR TRACES</span>
                     <span></span>
                 </div>
              </div>
           </div>
       </div>
    </div>
  );
};
