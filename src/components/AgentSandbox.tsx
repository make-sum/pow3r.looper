import React, { useState, useRef, useEffect } from "react";
import { Brain, Settings, Activity } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { askExpertAgent } from "../services/geminiService";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { useAppStore } from "../store/appStore";
import { toast } from "sonner";

export const AgentSandbox = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const [prompt, setPrompt] = useState("");
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const [history, setHistory] = useState<{ role: string, text: string }[]>([
    { role: "system", text: "Initializing agent shell..." },
    { role: "system", text: "Connecting task bus... [OK]" },
    { role: "system", text: "Securing sandbox boundary... [OK]" },
    { role: "system", text: "Ready for prompts_" }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = async () => {
    if (!prompt.trim() || isProcessing) return;
    
    const userPrompt = prompt.trim();
    setPrompt("");
    setIsProcessing(true);
    
    setHistory(prev => [...prev, { role: "user", text: `> ${userPrompt}` }]);
    
    try {
      const pastMessages = history.filter(h => h.role === "user" || h.role === "assistant").map(h => ({ role: h.role, text: h.text })) as any;
      const response = await askExpertAgent(userPrompt, pastMessages);
      setHistory(prev => [...prev, { role: "assistant", text: response }]);
      
      const req = buildPow3rRequest("LOCAL_AGENT_INVOKE", {
        target: "AgentSandbox",
        query: userPrompt,
        responseTokenCount: response.length
      });
      const res = await executePow3rWorkflow(req, async () => {
        return { 
          msg: `Agent Sandbox replied to: ${userPrompt.slice(0, 20)}...`,
          type: "Agent Invoke",
        };
      });
      appendLogs(res);
      toast.success("Agent Workflow Executed", { description: "Response tracked in XMAP" });
      
    } catch (e) {
      setHistory(prev => [...prev, { role: "system", text: "[ERROR: Backend connection failed]" }]);
      toast.error("Execution Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-blue-400 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(96,165,250,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-blue-400" />
        <div className="font-mono font-bold text-xs text-blue-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          <Brain className="w-4 h-4" /> Agent Sandbox
        </div>
        <div className="text-[10px] text-blue-300">Local LLM / Task runner</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-blue-400" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <dodecahedronGeometry args={[0.5]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-blue-400 font-mono bg-zinc-950 p-4 border border-blue-500/20 rounded">
        {JSON.stringify({ component: "AgentSandbox", llm: "Local/Edge", state: "sandbox_ready" }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">Agent Sandbox</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Local LLM Task Environment</p>
        </div>
        <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] rounded animate-pulse">
          SANDBOX: READY
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col relative overflow-hidden group">
               <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
                   <span className="flex items-center gap-2"><Brain className="w-4 h-4"/> EXECUTION TERMINAL</span>
                   <span className="text-blue-500">{isProcessing ? "PROCESSING" : "LIVE"}</span>
               </div>
               <div className="flex-1 w-full bg-zinc-950 border border-zinc-800 p-4 rounded text-[10px] text-blue-300 overflow-auto font-mono custom-scrollbar flex flex-col gap-2">
                 {history.map((h, i) => (
                    <div key={i} className={h.role === 'system' ? 'opacity-50' : h.role === 'user' ? 'text-blue-200' : 'text-blue-400 font-bold'}>
                      {h.role === 'assistant' && '> '}{h.text}
                    </div>
                 ))}
                 {isProcessing && <div className="text-blue-500 animate-pulse">&gt; Generating response...</div>}
                 <div ref={endRef} />
               </div>
               <div className="mt-4 flex shadow-[0_0_15px_rgba(96,165,250,0.1)] focus-within:shadow-[0_0_15px_rgba(96,165,250,0.2)] transition-shadow">
                  <span className="bg-zinc-950 border border-zinc-800 border-r-0 rounded-l p-3 text-blue-500 font-bold flex items-center justify-center">
                    &gt;
                  </span>
                  <input 
                    type="text" 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                    placeholder="Enter bash command or LLM prompt..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 border-l-0 border-r-0 p-3 outline-none focus:bg-zinc-900 text-blue-300 placeholder-blue-900 transition-colors disabled:opacity-50"
                  />
                  <button onClick={handleSend} disabled={isProcessing || !prompt.trim()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-r text-[10px] transition-colors disabled:opacity-50">
                     EXECUTE
                  </button>
               </div>
           </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col relative min-h-[120px]">
              <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between items-center">
                 <span className="flex items-center gap-1"><Settings className="w-3 h-3"/> WEBGPU LLM WEIGHTS</span>
                 <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded border border-blue-500/50">LOCAL</span>
              </div>
              <select className="w-full bg-zinc-950 border border-zinc-700 rounded text-[10px] text-blue-300 p-2 outline-none focus:border-blue-500 font-mono">
                  <option value="qwen-coder-2.5-7b">Qwen-Coder-2.5-7B (4-bit.gguf)</option>
                  <option value="llama-3-8b">Llama-3-8B-Instruct (q4_k_m.gguf)</option>
                  <option value="mistral-7b">Mistral-7B-v0.3 (q4_0.gguf)</option>
                  <option value="phi-3-mini">Phi-3-Mini-4K-Instruct (q4.gguf)</option>
              </select>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col relative">
               <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between items-center">
                   <span className="flex items-center gap-1"><Activity className="w-3 h-3"/> EXECUTION TRACE</span>
                   <div className="flex gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-blue-500'}`}></span>
                   </div>
               </div>
               <div className="flex-1 flex flex-col gap-3 justify-center text-[10px] grid grid-cols-2">
                   <div className="flex flex-col bg-zinc-950 p-2 rounded border border-zinc-800">
                       <span className="text-zinc-500 mb-1">HISTORY LEN</span>
                       <span className="text-emerald-400 font-bold text-xs font-mono">{history.length} MSG</span>
                   </div>
                   <div className="flex flex-col bg-zinc-950 p-2 rounded border border-zinc-800">
                       <span className="text-zinc-500 mb-1">PROMPT LEN</span>
                       <span className="text-purple-400 font-bold text-xs font-mono">{prompt.length} CHAR</span>
                   </div>
               </div>
               <div className="mt-4 pt-2 border-t border-zinc-800">
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                     {isProcessing && <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full w-[100%] animate-[progress_2s_ease-in-out_infinite_alternate]"></div>}
                  </div>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};
