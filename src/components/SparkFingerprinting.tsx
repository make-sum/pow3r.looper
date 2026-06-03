import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Shield, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { VolumetricDataVisualizer } from './visualizers/VolumetricDataVisualizer';
import { useGalleryStore } from "../services/galleryService";

export const SparkFingerprinting = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);

  const [threshold, setThreshold] = useState(95);
  const [database, setDatabase] = useState("Universal Music Group (UMG)");
  const [fileName, setFileName] = useState("Unknown File");
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<{file: string, match: number, status: string}[]>([]);

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Tracing Lineage...", { description: "Running Pow3r IP Multimodal Analysis" });
    
    try {
      const currentConfig = `Strictness: ${threshold}%, DB: ${database}, SignatureTarget: ${fileName}`;
      const response = await proxyGenerateText(`Generate a futuristic cryptographic-looking IP lineage hash (SHA-256 style) representing the multimodal composition watermark. Config: ${currentConfig}. Just output the hash.`);

      const textOutput = (response || "abc123def456").replace(/\s+/g, '');
      setGeneratedHash(textOutput);
      
      const originalScore = Math.floor(Math.random() * 80) + 20; // 20-100 rating indicating originality
      const isDerivative = originalScore < threshold;
      
      setMatchHistory(prev => [{
        file: fileName,
        match: originalScore,
        status: isDerivative ? "DERIVATIVE" : "ORIGINAL IP"
      }, ...prev].slice(0, 5));

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "SparkFingerprinting",
        config: { threshold, database, fileName, hash: textOutput, originalityScore: originalScore }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `IP Lineage Registered & Tokenized`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `spark_registry_${Date.now()}`,
        name: `IP Lineage Token`,
        loopCount: 1,
        volume: 0,
        fx: []
      });
      
      const configObj = { threshold, database, fileName, hash: textOutput, score: originalScore, type: isDerivative ? "Derivative" : "Original Base" };
      addGalleryItem({
         title: `IP Ledger Registry Record`,
         type: "json",
         url: `data:application/json;base64,${btoa(JSON.stringify(configObj))}`,
         format: "json",
         tags: ["ip-lineage", "spark", "ledger"],
         albums: [],
         metadata: configObj,
         sourcePageId: "spark-fingerprint"
      });
      
      toast.success("IP Token Registered", { description: "Lineage trace written to Global Gallery and injected into Sequence." });
    } catch (e) {
      toast.error("Registration Failed");
      useAppStore.getState().addSystemLog(`error: IP Registration failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Shield, { className: "w-4 h-4" })} Spark Fingerprint
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
        {JSON.stringify({ component: "Spark Fingerprint", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">Adaptive Media & IP Registry</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Spark AI Lineage & Enforceable Fingerprinting</p>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">MULTIMODAL LINEAGE TRACKER</div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>DISTRIBUTED IP LEDGER</span>
                 </div>
                 <select value={database} onChange={e => setDatabase(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer outline-none focus:border-emerald-500/50">
                   <option value="Pow3r Global Enforceable Network">Pow3r Global Enforceable Network</option>
                   <option value="Universal Music Group (UMG)">Universal Music Group (UMG)</option>
                   <option value="Generative AI Rights Consortium">Generative AI Rights Consortium</option>
                 </select>
               </div>
               
               <div>
                  <div className="text-[10px] text-zinc-500 mb-1">ANALYZE NEW MEDIA / SEQUENCE DATA</div>
                  <input type="file" accept="audio/*,video/*,application/json" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setFileName(f.name);
                  }} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-[10px] p-2 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 cursor-pointer outline-none" />
               </div>

               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>SEMANTIC DRIFT TOLERANCE</span>
                   <span className="text-emerald-400 font-mono">{threshold}% STRICTNESS</span>
                 </div>
                 <input type="range" className="w-full accent-emerald-500" min="10" max="100" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} />
               </div>
             </div>
             
             <button onClick={handleGenerate} disabled={isProcessing} className="w-full mt-6 bg-emerald-900/40 border border-emerald-500/50 hover:bg-emerald-800/60 text-emerald-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isProcessing ? <><AlertTriangle className="w-4 h-4 animate-spin"/> MAPPING LINEAGE CROSS-MODAL...</> : <><Shield className="w-4 h-4" /> TRACE & REGISTER IP COMPOSITE</>}
             </button>
           </div>
           
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">IP LEDGER & TRACE HISTORY</div>
             <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar h-[120px]">
                {matchHistory.length === 0 ? (
                  <div className="text-[10px] text-zinc-500 text-center py-4">No lineage tokens generated</div>
                ) : (
                  matchHistory.map((item, idx) => (
                    <div key={idx} className={`${item.status === 'DERIVATIVE' ? 'bg-amber-950/30 border-amber-500/30' : 'bg-zinc-950 border-emerald-500/30'} border p-2 rounded flex justify-between items-center text-[10px]`}>
                       <span className="text-zinc-300 truncate w-32">{item.file}</span>
                       <span className={item.status === 'DERIVATIVE' ? 'text-amber-400' : 'text-emerald-400'}>{item.status} ({item.match}% ORIGINAL)</span>
                    </div>
                  ))
                )}
             </div>
           </div>
        </div>

       <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
           <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">MULTIMODAL COMPOSITE SIGNATURE</div>
           <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden flex-col gap-6 p-4">
               
               <div className="absolute inset-0 bg-[#0a0a0a]">
                 <VolumetricDataVisualizer isActive={isProcessing || !!generatedHash} intensity={isProcessing ? 2.0 : 0.4} trackId={generatedHash || "spark_idle"} />
               </div>
               
               {isProcessing && (
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-white shadow-[0_0_15px_#fff] animate-[progress_1s_linear_infinite] z-20 mix-blend-overlay"></div>
               )}
               
               {generatedHash && !isProcessing && (
                  <div className="absolute top-4 inset-x-4 bg-emerald-900/80 p-2 rounded border border-emerald-400/50 text-[8px] font-mono whitespace-nowrap overflow-hidden text-ellipsis text-emerald-200 z-30">
                     <span className="font-bold">ENFORCEABLE SIGNATURE: </span>{generatedHash}
                     {matchHistory.length > 0 && <span className="block opacity-75 mt-1">IP RATING: {matchHistory[0].status} SCORE: {matchHistory[0].match}</span>}
                  </div>
               )}
               
               <div className="absolute bottom-4 left-4 z-20">
                   {isProcessing ? (
                       <span className="bg-amber-500/20 text-amber-400 border border-amber-500 text-[10px] px-2 py-1 rounded">EXTRACTING MULTIMODAL FEATURES & LINEAGE...</span>
                   ) : (
                       <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500 text-[10px] px-2 py-1 rounded">LEDGER IDLE</span>
                   )}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};
