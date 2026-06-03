import React, { useState } from "react";
import { Brain, Settings, Users, Zap, Layout, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";

export const AgentArchitect = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const [activeTab, setActiveTab] = useState("fleet");
  const [isProcessing, setIsProcessing] = useState(false);
  const appendLogs = useAppStore((state) => state.appendLogsFromPayload);
  const agents = useAppStore(state => state.agents);
  const addAgent = useAppStore(state => state.addAgent);

  const handleCreateAgent = async () => {
    setIsProcessing(true);
    toast.info("Spinning up new Agent...", { description: "Sending request to Agent Architect cluster" });
    try {
      const charlies = agents.filter(a => a.name.includes("Charlie")).length;
      const newName = charlies === 0 ? "Agent Charlie" : `Agent Charlie (${charlies + 1})`;
      
      const req = buildPow3rRequest("CONFIGURE_AGENT", {
        target: "AgentArchitect",
        config: { model: "Gemini-3.1-Pro", role: "Auto-Scout" }
      });

      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `New Agent Deployed: ${data.config?.role || "Agent"}`,
          type: "System Control",
          metadata: { agentModel: data.config?.model }
        };
      });

      appendLogs(res);
      useAppStore.getState().addSystemLog(`success: ${newName} successfully attached to swarm.`, "info");
      
      addAgent({
          id: `agent-${Date.now()}`,
          name: newName,
          role: "Auto-Scout",
          model: "Gemini-3.1-Pro",
          status: "idle"
      });
      
      toast.success("Agent Generated", { description: `${newName} (Auto-Scout) added to Fleet.` });
    } catch (e) {
      toast.error("Agent Deployment Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  
  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-fuchsia-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(217,70,239,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-fuchsia-500" />
        <div className="font-mono font-bold text-xs text-fuchsia-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          <Brain className="w-4 h-4" /> Agent Arch
        </div>
        <div className="text-[10px] text-fuchsia-300">Pow3r Multi-Agent Fleet</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-fuchsia-500" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#d946ef" />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-fuchsia-400 font-mono bg-zinc-950 p-4 border border-fuchsia-500/20 rounded">
        {JSON.stringify({ component: "Agent Architect", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]">Agent Architect</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Multi-Agent Swarm Orchestrator</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("fleet")} className={`px-4 py-2 flex items-center gap-2 text-xs font-bold rounded transition-colors ${activeTab === 'fleet' ? 'bg-fuchsia-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-fuchsia-400'}`}>
            <Users className="w-4 h-4" /> SWARM FLEET
          </button>
          <button onClick={() => setActiveTab("config")} className={`px-4 py-2 flex items-center gap-2 text-xs font-bold rounded transition-colors ${activeTab === 'config' ? 'bg-fuchsia-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-fuchsia-400'}`}>
            <Settings className="w-4 h-4" /> CONFIG
          </button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden flex flex-col">
          {activeTab === "fleet" ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar">
                {agents.map(agent => (
                    <div key={agent.id} className="bg-zinc-950 rounded border border-zinc-800 p-4 flex flex-col">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-sm font-bold text-fuchsia-400">{agent.name}</span>
                          <span className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-fuchsia-500 animate-pulse" : agent.status === "idle" ? "bg-emerald-500" : "bg-zinc-500"}`}></span>
                       </div>
                       <p className="text-[10px] text-zinc-500 mt-1">Role: {agent.role}</p>
                       <p className="text-[10px] text-zinc-500 mt-1">Model: {agent.model}</p>
                       <div className="mt-auto pt-4 border-t border-zinc-800">
                          <button onClick={() => toast.info(`Viewing Trace: ${agent.name}`, { description: 'Trace memory downloaded to dev logs.' })} className="w-full bg-zinc-900 hover:bg-zinc-800 text-[10px] text-fuchsia-300 py-2 rounded transition-colors font-bold uppercase tracking-wider">VIEW TRACES</button>
                       </div>
                    </div>
                ))}
                
                {/* Add agent button */}
                <button onClick={handleCreateAgent} disabled={isProcessing} className="bg-zinc-900 rounded border border-dashed border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-fuchsia-500 transition-colors disabled:opacity-50 min-h-[150px]">
                   {isProcessing ? <AlertTriangle className="w-8 h-8 text-fuchsia-500 animate-spin mb-2" /> : <Zap className="w-8 h-8 text-zinc-600 mb-2" />}
                   <span className="text-xs text-zinc-500 font-bold">{isProcessing ? "PROVISIONING..." : "ADD NEW AGENT"}</span>
                </button>
             </div>
          ) : (
             <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar pr-2">
                <div className="flex flex-col gap-6">
                   <div className="bg-zinc-950 border border-zinc-800 rounded p-4 flex flex-col gap-4">
                       <span className="text-xs text-zinc-400 font-bold border-b border-zinc-800 pb-2">SWARM POLICIES</span>
                       
                       <div className="flex items-center justify-between">
                           <span className="text-[10px] text-zinc-500">Enable Agent-to-Agent Communication</span>
                           <input type="checkbox" className="w-4 h-4 accent-fuchsia-500" defaultChecked />
                       </div>
                       <div className="flex items-center justify-between">
                           <span className="text-[10px] text-zinc-500">Auto-Suspend Idle Agents (5m)</span>
                           <input type="checkbox" className="w-4 h-4 accent-fuchsia-500" defaultChecked />
                       </div>
                   </div>

                   <div className="bg-zinc-950 border border-zinc-800 rounded p-4 flex flex-col gap-4">
                       <span className="text-xs text-zinc-400 font-bold border-b border-zinc-800 pb-2">MEMORY & CONTEXT WINDOWS</span>
                       <div>
                           <div className="flex justify-between text-[10px] text-zinc-500 mb-2">
                             <span>GLOBAL CONTEXT LIMIT</span>
                             <span className="text-fuchsia-400">128k</span>
                           </div>
                           <input type="range" className="w-full accent-fuchsia-500" min="8" max="256" defaultValue="128" />
                       </div>
                   </div>
                </div>
             </div>
          )}
      </div>
    </div>
  );
};
