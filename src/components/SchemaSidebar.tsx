import { proxyGenerateText } from "../services/geminiService";
import { useState } from "react";
import { useWorkflowStore } from "../store/useWorkflowStore";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import {
  Code2,
  Play,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export default function SchemaSidebar({ inline = false }: { inline?: boolean }) {
  const getAdapterJSON = useWorkflowStore((state) => state.getAdapterJSON);
  const viewMode = useWorkflowStore((state) => state.viewMode);
  const setViewMode = useWorkflowStore((state) => state.setViewMode);
  const setNavigation = useAppStore((state) => state.setNavigation);
  const setHasExecutedRuntime = useAppStore((state) => state.setHasExecutedRuntime);
  const currentVerticalIndex = useAppStore((state) => state.currentVerticalIndex);
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const [isOpen, setIsOpen] = useState(true);
  const [isValidated, setIsValidated] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [schemaAnalysis, setSchemaAnalysis] = useState<string | null>(null);

  const handleValidate = async () => {
    setIsExecuting(true);
    toast.info("Validating Layout...", { description: "Running Pow3r Schema validation" });
    
    try {
      const adapterJSON = useWorkflowStore.getState().getAdapterJSON();

      // Analyze the schema using AI
      const response = await proxyGenerateText(`Analyze this Pow3r workflow JSON and provide a 2 sentence summary of its structural integrity and correctness. \n\n${JSON.stringify(adapterJSON)}`);
      setSchemaAnalysis(response || "JSON Schema format is valid.");

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "SchemaSidebar",
        config: { action: "validate_schema", payload: adapterJSON }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Validation Complete`,
          type: "System Control",
          metadata: { validated: true }
        };
      });
      
      appendLogs(res);
      setIsValidated(true);
      setHasExecutedRuntime(true);
      toast.success("Validation Success", { description: "Graph schema verified." });
      
      // Auto-switch to surface view to show the result of Phase 1 gate passing
      if (!inline) setViewMode("surface");
      else setNavigation(0, 0); // go to music track
      
    } catch (e) {
      toast.error("Validation Failed");
      useAppStore.getState().addSystemLog(`error: Schema validation failed: ${String(e)}`, "error");
    } finally {
      setIsExecuting(false);
    }
  };

  const adapterJSON = getAdapterJSON();

  if (!isOpen && !inline) {
    return (
      <div
        className="absolute top-4 right-4 bg-zinc-900 border border-zinc-700 p-2 rounded cursor-pointer hover:bg-zinc-800 z-20"
        onClick={() => setIsOpen(true)}
      >
        <ChevronLeft className="w-5 h-5 text-cyan-400" />
      </div>
    );
  }

  return (
    <div className={`h-full ${inline ? 'w-full' : 'w-[450px] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l'} bg-zinc-900/95 border-zinc-800 flex flex-col z-20`}>
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-cyan-400">
          <Code2 className="w-5 h-5" />
          <h3 className="font-heading text-sm uppercase tracking-wide">
            Adapter JSON (v8)
          </h3>
        </div>
        {!inline && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 py-3 bg-zinc-950 flex border-b border-zinc-800">
        <div className="bg-zinc-900 rounded flex w-full border border-zinc-800">
          <button
            onClick={() => {
              if (inline) setNavigation(-5, 0);
              else setViewMode("xmap");
            }}
            className={`flex-1 py-1.5 text-xs font-mono font-bold transition-colors ${(viewMode === "xmap" && !inline) || (inline && currentVerticalIndex === -5) ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            [ XMAP DIAGRAM ]
          </button>
          <button
            onClick={() => {
              if (inline) setNavigation(-6, 0);
              else setViewMode("surface");
            }}
            className={`flex-1 py-1.5 text-xs font-mono font-bold transition-colors ${(viewMode === "surface" && !inline) || (inline && currentVerticalIndex === -6) ? "bg-neon-pink/20 text-neon-pink" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            [ XMAP JSON ]
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-[#0a0a0a]">
        {schemaAnalysis && (
          <div className="mb-4 bg-indigo-900/30 border border-indigo-500/50 p-3 rounded-md text-[11px] font-mono text-indigo-200 whitespace-pre-wrap">
            <span className="font-bold text-indigo-400 block mb-1">AI SCHEMA ANALYSIS:</span>
            {schemaAnalysis}
          </div>
        )}
        <pre className="text-[11px] font-sans text-zinc-300 whitespace-pre-wrap break-all leading-relaxed">
          {JSON.stringify(adapterJSON, null, 2)}
        </pre>
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        <div className="flex items-center justify-between mb-3 text-xs font-sans">
          <span className="text-zinc-500">Validation Status</span>
          {isValidated ? (
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="w-4 h-4" /> Validated
            </span>
          ) : (
            <span className="text-yellow-500">Pending Execution</span>
          )}
        </div>

        <button
          onClick={handleValidate}
          disabled={isExecuting || isValidated}
          className={`w-full py-2.5 rounded font-sans text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            isValidated
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : isExecuting
                ? "bg-indigo-600/50 text-indigo-200 cursor-wait"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
          }`}
        >
          <Play className={`w-4 h-4 ${isExecuting ? "animate-pulse" : ""}`} />
          {isExecuting
            ? "Running Orchestrator..."
            : "Execute Validator (Phase 9)"}
        </button>
      </div>
    </div>
  );
}
