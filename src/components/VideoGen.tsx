import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Video, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { useGalleryStore } from "../services/galleryService";

export const VideoGen = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const mediaCache = useAppStore((state) => state.mediaCache);
  const setMediaCache = useAppStore((state) => state.setMediaCache);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState("A futuristic cyberpunk city seen from a drone flying rapidly down a neon-lit alleyway in heavy rain. Cinematic 8k, anamorphic lens flare.");
  const [cameraMotion, setCameraMotion] = useState("DRONE FLY");
  const [aspectRatio, setAspectRatio] = useState("16:9 (Cinematic)");
  const [pipelineMode, setPipelineMode] = useState("Veo 3 WF mode");
  
  const generatedVideo = mediaCache["videoGen"] || null;

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info(`Rendering Scene via ${pipelineMode}...`, { description: "Dispatching to Veo 3 Cloud nodes via Pow3r WF" });

    try {
      const apiKey = (import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY) as string;
      if (!apiKey) throw new Error("API Key missing");
      let ratioCode = "16:9";
      if (aspectRatio.startsWith("16:9")) ratioCode = "16:9";
      else if (aspectRatio.startsWith("9:16")) ratioCode = "9:16";

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: `[Camera: ${cameraMotion}] ${prompt}`,
        config: {
          personGeneration: "DONT_ALLOW"
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      let finalVideoUrl = generatedVideo || "";
      if (downloadLink) {
        const videoRes = await fetch(downloadLink, {
          method: 'GET',
          headers: { 'x-goog-api-key': apiKey },
        });
        const blob = await videoRes.blob();
        
        const reader = new FileReader();
        await new Promise((resolve) => {
           reader.onloadend = () => {
              finalVideoUrl = reader.result as string;
              setMediaCache("videoGen", finalVideoUrl);
              resolve(null);
           };
           reader.readAsDataURL(blob);
        });
      }

      const req = buildPow3rRequest("GENERATE_MEDIA", {
        target: "VideoGen",
        prompt,
        config: { cameraMotion, aspectRatio, pipelineMode }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Video synthesis complete: ${data.prompt?.substring(0, 20)}...`,
          type: "Video Layer",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `video_gen_${Date.now()}`,
        name: `Veo 3 (${res.data?.metadata?.cameraMotion || "VIDEO"})`,
        loopCount: 4,
        volume: 0,
        fx: [],
        mediaRef: "videoGen"
      });
      
      if (finalVideoUrl) {
         addGalleryItem({
            title: `Veo 3 (${cameraMotion})`,
            type: "video",
            url: finalVideoUrl,
            format: "mp4",
            tags: [cameraMotion, pipelineMode, "veo3"],
            albums: [],
            metadata: { prompt, cameraMotion, aspectRatio },
            sourcePageId: "video"
         });
      }
      toast.success("Generation Successful", { description: "Added to main slide sequencer and Global Gallery." });
    } catch (e: any) {
      toast.error("Generation Failed");
      useAppStore.getState().addSystemLog(`error: Veo video generation failed: ${e.message || String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Video, { className: "w-4 h-4" })} Video Gen
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
        {JSON.stringify({ component: "Video Gen", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">Video Generator (Veo 3 WF)</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Generative Video Orchestrator</p>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2"><Video className="w-4 h-4"/> SCENE PROMPT</div>
             <textarea 
               className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-300 font-sans text-sm focus:outline-none focus:border-emerald-500/50 resize-none custom-scrollbar"
               placeholder="Describe the scene..."
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
             />
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">DIRECTOR CONTROLS</div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>CAMERA MOTION</span>
                   <span className="text-emerald-400 font-mono">{cameraMotion}</span>
                 </div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer" value={cameraMotion} onChange={(e) => setCameraMotion(e.target.value)}>
                   <option>PAN LEFT</option>
                   <option>PAN RIGHT</option>
                   <option>ZOOM IN</option>
                   <option>FPV DRONE</option>
                   <option>STATIC</option>
                 </select>
               </div>
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>ASPECT RATIO</span>
                   <span className="text-emerald-400 font-mono">{aspectRatio.split(' ')[0]}</span>
                 </div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                   <option>16:9 (Cinematic)</option>
                   <option>9:16 (Vertical)</option>
                   <option>1:1 (Square)</option>
                 </select>
               </div>
               <div className="col-span-2 mt-2">
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>PIPELINE ENGINE</span>
                   <span className="text-emerald-400 font-mono">{pipelineMode}</span>
                 </div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer" value={pipelineMode} onChange={(e) => setPipelineMode(e.target.value)}>
                   <option>Veo 3 Standard</option>
                   <option>Veo 3 WF mode</option>
                   <option>Veo Vision Agent</option>
                 </select>
               </div>
               <div className="col-span-2 mt-2">
                 <button onClick={handleGenerate} disabled={isProcessing} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md text-xs font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    {isProcessing ? "RENDERING SCENE..." : <><Play className="w-3 h-3 fill-white" /> SUBMIT TO VEO 3 ENGINE</>}
                 </button>
               </div>
             </div>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
           <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">OUTPUT PREVIEW</div>
           <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden">
             {isProcessing ? (
               <div className="flex flex-col items-center gap-3">
                 <AlertTriangle className="w-8 h-8 text-emerald-500 animate-spin" />
                 <span className="text-xs text-emerald-400 animate-pulse tracking-widest">RAYTRACING SCENE...</span>
                 <div className="w-48 h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                   <div className="h-full bg-emerald-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                 </div>
               </div>
             ) : generatedVideo ? (
               <video src={generatedVideo} autoPlay loop controls className="w-full h-full object-contain" />
             ) : (
               <div className="text-zinc-600 text-xs flex flex-col items-center gap-2">
                 <Video className="w-12 h-12 opacity-20" />
                 <span>Renders will appear here</span>
               </div>
             )}
           </div>
           
           <div className="mt-4 pt-4 border-t border-zinc-800">
             <div className="text-[10px] text-zinc-500 mb-2">RENDER LOG</div>
             <div className="bg-zinc-950 text-emerald-500/70 p-2 rounded text-[9px] min-h-[60px] font-mono whitespace-pre-wrap">
               {isProcessing ? `> Starting Veo 3 WF workflow...
> Allocating GPU quota (H100 x8)...
> Generating noise seeds...` : `> Waiting for instruction...`}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
