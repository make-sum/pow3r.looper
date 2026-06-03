import { useState } from "react";
import { motion } from "motion/react";
import { MCPControlDefinition } from "../config/pageSchemas";
import { useAppStore } from "../store/appStore";
import {
  buildPow3rRequest,
  executePow3rWorkflow,
} from "../services/unifiedSchema";
import { toast } from "sonner";

export default function Pow3rControl({
  control,
}: {
  control: MCPControlDefinition;
  key?: string | number;
}) {
  const [val, setVal] = useState(control.defaultValue);
  const appendLogs = useAppStore((state) => state.appendLogsFromPayload);

  // General handler to run unified schema requests for every parameter update
  const handleUpdate = async (newVal: any) => {
    setVal(newVal);

    const request = buildPow3rRequest("UPDATE_PARAMETER", {
      componentId: control.id,
      newValue: newVal,
    });

    // Mock orchestration of parameter to MCP Tool Call
    const response = await executePow3rWorkflow(request, async () => {
      // In a real app, this waits for edge response.
      await new Promise((r) => setTimeout(r, 150));
      return { parameter: control.id, updatedTo: newVal };
    });

    appendLogs(response);
    toast.success(`Parameter Updated`, { description: `${control.label} set to ${newVal}` });
  };

  switch (control.type) {
    case "slider":
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-center mb-2">
            <span className="text-zinc-300 font-sans text-xs font-bold">
              {control.label}
            </span>
            <span className="text-cyan-500 font-mono text-[10px]">{val}</span>
          </div>
          <input
            type="range"
            min={control.min}
            max={control.max}
            step={control.step || 1}
            value={val}
            onChange={(e) => handleUpdate(Number(e.target.value))}
            className="w-full accent-cyan-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer relative z-10"
          />
        </div>
      );
    case "switch":
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg flex justify-between items-center group">
          <span className="text-zinc-300 font-sans text-xs font-bold">
            {control.label}
          </span>
          <button
            onClick={() => handleUpdate(!val)}
            className={`w-10 h-5 rounded-full relative transition-colors ${val ? "bg-cyan-500" : "bg-zinc-800"}`}
          >
            <motion.div
              animate={{ x: val ? 20 : 2 }}
              className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm"
            />
          </button>
        </div>
      );
    case "select":
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg flex flex-col gap-2">
          <span className="text-zinc-300 font-sans text-xs font-bold">
            {control.label}
          </span>
          <select
            value={val}
            onChange={(e) => handleUpdate(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-400 p-2 rounded outline-none focus:border-cyan-500"
          >
            {control.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );
    default:
      return null;
  }
}
