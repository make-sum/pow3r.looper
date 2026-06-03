import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Code, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { useGalleryStore } from "../services/galleryService";

export const AgentGen = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);

  const [temperature, setTemperature] = useState(70);
  const [topP, setTopP] = useState(90);
  const [directive, setDirective] = useState("You are an expert audio engineering agent. Your goal is to analyze the mixing parameters and provide adjustments to achieve a balanced, dynamic sound suitable for spatial playback. You have access to the [MIXER_API] and [XMAP_SCHEMA].");
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Synthesizing Agent...", { description: "Compiling behavior matrix via Pow3r" });
    
    try {
      const currentConfig = `Temperature: ${temperature / 100}, TopP: ${topP / 100}`;
      const response = await proxyGenerateText(`Given the following system directive, generate a short 3-step action plan the agent should execute initially to fulfill its goal. Directive: ${directive}\nConfig: ${currentConfig}`);

      const textOutput = response || "Agent initialized with empty matrix.";
      setGeneratedPlan(textOutput);

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "AgentGen",
        prompt: directive,
        config: { temperature, topP, generatedPlan: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Agent compiled with ${directive.length} chars`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `agent_gen_${Date.now()}`,
        name: `Observer Agent Thread`,
        loopCount: 16,
        volume: 0,
        fx: [],
        metadata: { temperature, topP, generatedPlan: textOutput, directive }
      });
      
      const configObj = { temperature, topP, generatedPlan: textOutput, directive };
      addGalleryItem({
         title: `Agent Plan`,
         type: "agent",
         url: `data:application/json;base64,${btoa(JSON.stringify(configObj))}`,
         format: "json",
         tags: ["agent", "plan", "behavior"],
         albums: [],
         metadata: configObj,
         sourcePageId: "agent"
      });
      
      toast.success("Agent Active", { description: "Agent injected into XMAP context loop and Global Gallery." });
    } catch (e: any) {
      toast.error("Compilation Failed");
      useAppStore.getState().addSystemLog(`error: Agent synthesis failed: ${e.message || String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Code, { className: "w-4 h-4" })} Agent Gen
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
        {JSON.stringify({ component: "Agent Gen", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]">Agent Architect</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Autonomous Persona Synthesis</p>
        </div>
        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] rounded animate-pulse">
          ASSEMBLY: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">COGNITIVE CORE CONFIGURATION</div>
             <div className="space-y-4">
                 <div>
                     <div className="text-[10px] text-zinc-500 mb-1">FOUNDATION MODEL</div>
                     <select className="w-full bg-zinc-950 border border-zinc-800 text-rose-300 rounded text-xs p-2 cursor-pointer font-bold">
                       <option>Gemini 1.5 Pro</option>
                       <option>Gemini 1.5 Flash</option>
                       <option>Claude 3.5 Sonnet</option>
                       <option>Grok Heavy (Optimized)</option>
                     </select>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                       <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                         <span>TEMPERATURE</span>
                         <span className="text-rose-400 font-mono">{(temperature / 100).toFixed(2)}</span>
                       </div>
                       <input type="range" className="w-full accent-rose-500" min="0" max="200" value={temperature} onChange={(e) => setTemperature(parseInt(e.target.value))} />
                     </div>
                     <div>
                         <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                           <span>TOP P</span>
                           <span className="text-rose-400 font-mono">{(topP / 100).toFixed(2)}</span>
                         </div>
                         <input type="range" className="w-full accent-rose-500" min="0" max="100" value={topP} onChange={(e) => setTopP(parseInt(e.target.value))} />
                     </div>
                 </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
                 <span>SYSTEM DIRECTIVE</span>
                 <span className="text-rose-500">TOKENS: ~840</span>
             </div>
             <textarea 
               className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-zinc-300 text-xs focus:outline-none focus:border-rose-500 resize-none font-mono leading-relaxed"
               placeholder="Define the agent's persona, rules, and capabilities..."
               value={directive}
               onChange={(e) => setDirective(e.target.value)}
             />
             
             <div className="flex flex-wrap gap-2 mt-4">
                 <span className="bg-rose-900/30 text-rose-300 text-[9px] px-2 py-1 rounded border border-rose-500/50 flex items-center gap-1 cursor-pointer hover:bg-rose-800/50">
                    <Code className="w-3 h-3" /> ADD TOOL ALLOWLIST
                 </span>
                 <span className="bg-zinc-950 text-zinc-400 text-[9px] px-2 py-1 rounded border border-zinc-800 flex items-center gap-1 cursor-pointer hover:bg-zinc-800">
                    + INJECT KNOWLEDGE BASE
                 </span>
             </div>
           </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[50px] pointer-events-none"></div>
               
               <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between items-center relative z-10">
                   <span>AGENTIC BEHAVIORS</span>
                   <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_5px_#f43f5e] animate-pulse"></div>
               </div>
               
               <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar relative z-10 pr-2">
                   {/* Behavior Toggle 1 */}
                   <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded flex items-center justify-between">
                       <div>
                           <div className="text-xs font-bold text-zinc-300">Continuous Evaluation Loop</div>
                           <div className="text-[10px] text-zinc-500">Agent autonomously evaluates outputs against goals.</div>
                       </div>
                       <div className="w-8 h-4 bg-rose-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                           <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-white rounded-full"></div>
                       </div>
                   </div>

                   {/* Behavior Toggle 2 */}
                   <div className="bg-zinc-950/80 border border-rose-500/30 p-3 rounded flex items-center justify-between">
                       <div>
                           <div className="text-xs font-bold text-rose-400">XMAP State Injection</div>
                           <div className="text-[10px] text-zinc-500">Agent can read/write global Pow3r state.</div>
                       </div>
                       <div className="w-8 h-4 bg-rose-500 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                           <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-white rounded-full"></div>
                       </div>
                   </div>

                   {/* Behavior Toggle 3 */}
                   <div className="bg-zinc-950/80 border border-zinc-800 p-3 rounded flex items-center justify-between opacity-50">
                       <div>
                           <div className="text-xs font-bold text-zinc-300">Swarm Coordination</div>
                           <div className="text-[10px] text-zinc-500">Enable peer-to-peer agent communication.</div>
                       </div>
                       <div className="w-8 h-4 bg-zinc-700 rounded-full relative cursor-pointer">
                           <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-zinc-400 rounded-full"></div>
                       </div>
                   </div>
                   
                   {generatedPlan && !isProcessing && (
                       <div className="mt-4 p-3 bg-rose-950/20 border border-rose-500/20 rounded text-[10px] text-zinc-300 font-mono flex flex-col gap-2">
                           <div className="text-rose-400 font-bold border-b border-rose-900/50 pb-1">AI GENERATED INITIAL PLAN:</div>
                           <div className="whitespace-pre-wrap">{generatedPlan}</div>
                       </div>
                   )}
                   
                   {isProcessing && (
                       <div className="mt-4 p-3 bg-rose-950/50 border border-rose-500/30 rounded text-[10px] text-rose-300 font-mono flex flex-col gap-1">
                           <div className="text-rose-400 font-bold border-b border-rose-900/50 pb-1 mb-1">COMPILING AGENT THREAD...</div>
                           <span>&gt; Validating schemas... [OK]</span>
                           <span>&gt; Constructing system prompt... [OK]</span>
                           <span className="animate-pulse">&gt; Establishing XMAP bindings...</span>
                       </div>
                   )}
               </div>

               <button onClick={handleGenerate} disabled={isProcessing} className="w-full bg-rose-900/40 border border-rose-500/50 hover:bg-rose-800/60 text-rose-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 relative z-10">
                  {isProcessing ? "SYNTHESIZING AGENT..." : <><Code className="w-4 h-4" /> DEPLOY AGENTIC INSTANCE</>}
               </button>
           </div>
        </div>
      </div>
    </div>
  );
};
