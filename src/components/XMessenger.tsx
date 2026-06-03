import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { toast } from "sonner";
import { askExpertAgent } from "../services/geminiService";
import { buildPow3rRequest, executePow3rWorkflow } from "../services/unifiedSchema";

export const XMessenger = ({ mode = "ui", chat: fallbackChat = [] }: { mode?: "ui" | "3d" | "flow" | "json"; chat?: any[] }) => {
  const [input, setInput] = useState("");
  const storeChat = useAppStore((state) => state.expertChat);
  const addExpertChat = useAppStore((state) => state.addExpertChat);
  const updateExpertChat = useAppStore((state) => state.updateExpertChat);
  const addSystemLog = useAppStore((state) => state.addSystemLog);
  const appendLogs = useAppStore((state) => state.appendLogsFromPayload);
  
  const chat = storeChat.length ? storeChat : fallbackChat;

  const handleSend = async () => {
    if (!input.trim()) return;
    const msgText = input;
    setInput("");

    toast("Command Sent via X-Messenger", { description: "Intercepted by AI systems." });
    addSystemLog(`User via X-Messenger: "${msgText}"`);
    
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();
    
    addExpertChat({ id: userMsgId, role: "user", text: msgText });
    addExpertChat({ id: assistantMsgId, role: "assistant", text: "..." });

    const request = buildPow3rRequest("AGENT_CHAT", {
      expertInput: msgText,
      newHistory: chat,
      ragContext: { semantic: "Direct routing", vector_similarity: 0.99 }
    });

    try {
      const response = await executePow3rWorkflow(request, async (data) => {
        const gHistory = chat.map((m: any) => ({
          role: m.role as "user" | "assistant",
          text: m.text || m.message,
        }));
        return await askExpertAgent(msgText, gHistory);
      });
      appendLogs(response);

      if (response.status === "success" && response.data) {
        updateExpertChat(assistantMsgId, response.data);
        toast.success("AI Response received", { description: "Message appended to chat." });
      } else {
        updateExpertChat(assistantMsgId, "[Connection Error or Timeout]");
        addSystemLog(`error: ${response.error || "Unknown Chat Error"}`, "error");
        toast.error("AI Comms error");
      }
    } catch (err) {
      updateExpertChat(assistantMsgId, "System fault.");
      toast.error("System fault triggered.");
    }
  };
  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-neon-pink rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(255,20,147,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-neon-pink" />
        <div className="font-mono font-bold text-xs text-neon-pink uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2">
          X-Messenger
        </div>
        <div className="text-[10px] text-pink-300">AI Comms Node. Msg: {chat.length}</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-neon-pink" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <torusGeometry args={[0.5, 0.1, 16, 32]} />
        <meshStandardMaterial color="#ff1493" />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-neon-pink font-mono bg-zinc-950 p-4 border border-neon-pink/20 rounded">
        {JSON.stringify({ component: "X-Messenger", messages: chat.length }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col h-full font-mono text-[10px] p-4">
       <div className="text-neon-pink font-bold mb-4 uppercase text-lg border-b border-zinc-800 pb-2 flex justify-between">
        <span>X-Messenger / AI System Chat</span>
        <span className="text-zinc-500">EXPERT RAG</span>
      </div>
      <div className="flex-1 overflow-auto custom-scrollbar flex flex-col gap-4 mb-4">
         {chat.map((c) => (
            <div key={c.id} className={`max-w-[80%] p-4 rounded-xl ${c.role === "assistant" ? "bg-zinc-900 border border-neon-pink text-pink-200 self-start" : "bg-cyan-900/30 border border-cyan-500/50 text-cyan-200 self-end"}`}>
               <div className="text-zinc-500 mb-1 opacity-60">@{c.role}</div>
               <div className="whitespace-pre-wrap text-sm leading-relaxed">{c.text || c.message}</div>
            </div>
         ))}
      </div>
      <div className="h-16 flex items-center gap-2 border-t border-zinc-800 pt-4">
         <input 
            type="text" 
            placeholder="Send system command..." 
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-4 h-full text-zinc-300 focus:outline-none focus:border-neon-pink" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend() }}
         />
         <button onClick={handleSend} className="h-full px-6 bg-neon-pink/20 text-neon-pink rounded border border-neon-pink hover:bg-neon-pink hover:text-black font-bold transition-colors">SEND</button>
      </div>
    </div>
  );
};
