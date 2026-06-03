import React, { useState } from "react";
import { Activity, Filter } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { toast } from "sonner";
import { useAppStore } from "../store/appStore";

export const XBugger = ({ mode = "ui", logs: defaultLogs = [] }: { mode?: "ui" | "3d" | "flow" | "json"; logs?: any[] }) => {
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const storeLogs = useAppStore(state => state.systemLogs);
  const addSystemLog = useAppStore(state => state.addSystemLog);
  const logs = storeLogs.length ? storeLogs : defaultLogs;

  const filteredLogs = filterLevel 
    ? logs.filter(log => log.level === filterLevel)
    : logs;

  const triggerTest = () => {
    toast.success("X-Bugger Manual Trace", { description: "Emitted a manual trace event." });
    addSystemLog("user: Manual trace emitted from X-Bugger UI via X-LOG pipeline.", "info");
    addSystemLog("user: Warning test emitted.", "warn");
    addSystemLog("user: Error test emitted.", "error");
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-cyan-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(0,240,255,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-cyan-500" />
        <div className="font-mono font-bold text-xs text-cyan-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2">
          X-Bugger Node
        </div>
        <div className="text-[10px] text-cyan-300">Tracking {logs.length} edge events...</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-cyan-500" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#00f0ff" wireframe />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-cyan-400 font-mono bg-zinc-950 p-4 border border-cyan-500/20 rounded">
        {JSON.stringify({ component: "X-Bugger", telemetry_logs: logs.length }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono text-[10px] h-full p-4 relative">
      <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
        <div className="text-cyan-400 font-bold uppercase text-lg">
          X-Bugger / Telemetry
        </div>
        <div className="flex items-center gap-2">
          <button 
             onClick={() => setFilterLevel(null)} 
             className={`px-2 py-1 rounded transition-colors border ${!filterLevel ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-900'}`}
          >
            ALL
          </button>
          <button 
             onClick={() => setFilterLevel("info")} 
             className={`px-2 py-1 rounded transition-colors border ${filterLevel === "info" ? 'bg-cyan-900/30 text-cyan-300 border-cyan-500/50' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-900'}`}
          >
            INFO
          </button>
          <button 
             onClick={() => setFilterLevel("warn")} 
             className={`px-2 py-1 rounded transition-colors border ${filterLevel === "warn" ? 'bg-yellow-900/30 text-yellow-300 border-yellow-500/50' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-900'}`}
          >
            WARN
          </button>
          <button 
             onClick={() => setFilterLevel("error")} 
             className={`px-2 py-1 rounded transition-colors border ${filterLevel === "error" ? 'bg-red-900/30 text-red-300 border-red-500/50' : 'bg-transparent text-zinc-500 border-transparent hover:bg-zinc-900'}`}
          >
            ERROR
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-zinc-500">LIVE FEED ({filteredLogs.length})</span>
        <button onClick={triggerTest} className="px-3 py-1 bg-cyan-900/30 text-cyan-300 border border-cyan-500/50 rounded hover:bg-cyan-500 hover:text-black transition-colors font-bold">EMIT EVENT</button>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col gap-2">
         {filteredLogs.map((log) => (
            <div key={log.id} className={`border p-3 rounded text-cyan-300 ${log.level === 'error' ? 'bg-red-950/30 border-red-500/30 text-red-200' : log.level === 'warn' ? 'bg-yellow-950/30 border-yellow-500/30 text-yellow-200' : 'bg-[#141414] border-cyan-500/20'}`}>
               <span className="text-zinc-500 mr-2">[{new Date(log.timestamp || Date.now()).toISOString().split("T")[1].substring(0, 8)}]</span>
               <span className="font-bold text-neon-pink mr-2">[X-EVENT]</span>
               {log.message}
            </div>
         ))}
      </div>
    </div>
  );
};
