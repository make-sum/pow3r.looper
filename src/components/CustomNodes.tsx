import { memo } from "react";
import { Handle, Position } from "@xyflow/react";

export const CoreNode = memo(({ data }: any) => {
  return (
    <div className="bg-zinc-900 border-2 border-indigo-500 rounded-xl p-4 min-w-[200px] shadow-[0_0_15px_rgba(99,102,241,0.5)]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-indigo-500 border-2 border-zinc-900"
      />
      <div className="font-heading text-lg text-indigo-400 mb-2 truncate">
        {data.name}
      </div>
      <div className="text-xs font-sans text-zinc-400 mb-2 border-b border-zinc-700 pb-2">
        Type: {data.type}
      </div>
      <div className="flex flex-wrap gap-1">
        {data.capabilities?.map((cap: string) => (
          <span
            key={cap}
            className="px-1.5 py-0.5 bg-zinc-800 text-[10px] rounded text-zinc-300"
          >
            {cap}
          </span>
        ))}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-indigo-500 border-2 border-zinc-900"
      />
    </div>
  );
});

export const UINode = memo(({ data }: any) => {
  return (
    <div className="bg-[#050505] border border-cyan-500/50 rounded-lg p-3 min-w-[200px] shadow-[0_0_15px_rgba(0,240,255,0.2)]">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyan-400 border-2 border-zinc-900"
      />
      <div className="flex justify-between items-center mb-2">
        <div className="font-heading text-sm text-cyan-400 truncate">
          {data.name}
        </div>
        <div
          className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"
          title="Deploying"
        />
      </div>

      <div className="text-[10px] font-sans text-zinc-500 bg-zinc-900 border border-zinc-800 rounded p-1 mb-2 font-mono break-all">
        {data.type}
      </div>

      <div className="flex flex-wrap gap-1">
        {data.capabilities?.map((cap: string) => (
          <span
            key={cap}
            className="px-1 py-0.5 bg-cyan-950/30 text-[9px] rounded text-cyan-300 border border-cyan-900/50"
          >
            {cap}
          </span>
        ))}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-cyan-400 border-2 border-zinc-900"
      />
    </div>
  );
});

export const BuilderNode = memo(({ data }: any) => {
  const getDevStatusColor = (status: string) => {
    switch (status) {
      case "open":
      case "not-started":
        return { border: "border-orange-500", text: "text-orange-400", bg: "bg-orange-500/10", glow: "shadow-[0_0_15px_rgba(249,115,22,0.3)]" };
      case "in-progress":
        return { border: "border-blue-500", text: "text-blue-400", bg: "bg-blue-500/10", glow: "shadow-[0_0_15px_rgba(59,130,246,0.3)]" };
      case "blocked":
        return { border: "border-red-500", text: "text-red-400", bg: "bg-red-500/10", glow: "shadow-[0_0_15px_rgba(239,68,68,0.3)]" };
      case "complete":
        return { border: "border-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]" };
      default:
        return { border: "border-zinc-500", text: "text-zinc-400", bg: "bg-zinc-500/10", glow: "" };
    }
  };

  const statusStyle = getDevStatusColor(data.plan?.devStatus || data.status);

  return (
    <div className={`bg-[#0a0a0a] border-2 ${statusStyle.border} rounded-lg p-3 min-w-[280px] max-w-[320px] ${statusStyle.glow}`}>
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 border-2 border-zinc-900`}
        style={{ background: statusStyle.border.replace('border-', '') }}
      />
      <div className="flex justify-between items-start mb-2 border-b border-zinc-800 pb-2">
        <div className={`font-mono font-bold text-xs ${statusStyle.text} uppercase tracking-wider`}>
          {data.name}
        </div>
        <div
          className={`px-1.5 py-0.5 rounded text-[8px] font-mono border ${statusStyle.border} ${statusStyle.text} ${statusStyle.bg}`}
        >
          {data.plan?.devStatus || "pending"}
        </div>
      </div>

      {data.plan && (
        <div className="flex flex-col gap-2 mb-3">
          <div className="bg-zinc-900/50 p-2 rounded text-[10px] font-sans text-zinc-300 leading-relaxed border border-zinc-800">
            <span className="text-zinc-500 font-bold block mb-1">GOAL:</span>
            {data.plan.goal}
          </div>
          
          <div className="grid grid-cols-2 gap-1 text-[9px] font-mono mt-1">
            <div className="text-zinc-500 flex justify-between"><span>SIZE:</span> <span className="text-zinc-300">{data.plan.engineeringSize}</span></div>
            <div className="text-zinc-500 flex justify-between"><span>TASK:</span> <span className="text-zinc-300 truncate ml-1">{data.plan.taskId}</span></div>
            <div className="text-zinc-500 flex justify-between"><span>PLAN:</span> <span className="text-zinc-300 truncate ml-1">{data.plan.planId}</span></div>
            <div className="text-zinc-500 flex justify-between"><span>VER:</span> <span className="text-zinc-300">{data.plan.versionId}</span></div>
          </div>
          
          <div className="bg-zinc-900 p-1.5 rounded text-[9px] font-sans text-zinc-400 mt-1">
            <span className="text-zinc-500 object-left block">SUCCESS REQ:</span>
            <span className="truncate block mt-0.5">{data.plan.goalSuccessRequirement}</span>
          </div>
          <div className="bg-zinc-900 p-1.5 rounded text-[9px] font-sans text-emerald-400 mt-1 border border-emerald-900/50">
            <span className="text-emerald-500/70 block mb-0.5">AGENT IN CHARGE:</span>
            <span>{data.plan.agent_in_charge || "Agent-AI-Studio-Gemini-3.1-Pro-Preview"}</span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1 mt-2">
        {data.capabilities?.map((cap: string) => (
          <span
            key={cap}
            className={`px-1 py-0.5 ${statusStyle.bg} border ${statusStyle.border} text-[9px] rounded ${statusStyle.text} opacity-80`}
          >
            {cap}
          </span>
        ))}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 border-2 border-zinc-900`}
        style={{ background: statusStyle.border.replace('border-', '') }}
      />
    </div>
  );
});

export const PlatformNode = memo(({ data }: any) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-500 text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]";
      case "degraded":
        return "bg-yellow-500 text-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]";
      case "validating":
        return "bg-blue-500 text-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
      case "deploying":
        return "bg-cyan-500 text-cyan-500 shadow-[0_0_8px_rgba(0,240,255,0.6)]";
      default:
        return "bg-zinc-500 text-zinc-500";
    }
  };

  const statusColor = getStatusColor(data.status);

  return (
    <div className="bg-zinc-900/80 backdrop-blur border border-zinc-700 rounded-lg p-3 min-w-[180px] hover:border-zinc-500 transition-colors">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-zinc-400 border-2 border-zinc-900"
      />
      <div className="flex justify-between items-center mb-2">
        <div className="font-sans font-bold text-sm text-zinc-100">
          {data.name}
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${statusColor.split(" ")[0]} ${statusColor.split(" ")[2]}`}
          title={`Status: ${data.status}`}
        />
      </div>

      <div className="text-[11px] font-sans text-zinc-500 uppercase tracking-widest mb-1.5">
        Platform: {data.deploymentMetadata?.platform || "Unknown"}
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {data.capabilities?.map((cap: string) => (
          <span
            key={cap}
            className="px-1 py-0.5 bg-zinc-800/50 text-[9px] rounded text-zinc-400 border border-zinc-800"
          >
            {cap}
          </span>
        ))}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-zinc-400 border-2 border-zinc-900"
      />
    </div>
  );
});
