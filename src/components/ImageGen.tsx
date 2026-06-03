import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { Image as ImageIcon, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { useGalleryStore } from "../services/galleryService";

export const ImageGen = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState("A hyper-realistic neon-lit cyberpunk street with flying cars, 4k, cinematic lighting, octane render.");
  const [aspectRatio, setAspectRatio] = useState("16:9 (Cinematic)");
  const [stylePreset, setStylePreset] = useState("CYBERPUNK");
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Generating Image...", { description: "Dispatching to Imagen 3 Cloud nodes via Pow3r" });
    
    try {
      // Map formatting to aspect ratios supported by gemini
      let ratioCode = "16:9";
      if (aspectRatio.startsWith("1:1")) ratioCode = "1:1";
      if (aspectRatio.startsWith("9:16")) ratioCode = "9:16";
      if (aspectRatio.startsWith("4:3")) ratioCode = "4:3";

      const finalPrompt = `[Style: ${stylePreset}] ${prompt}`;
      
      const apiRes = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: finalPrompt, aspectRatio: ratioCode })
      });
      
      if (!apiRes.ok) {
          const errData = await apiRes.json().catch(() => ({}));
          throw new Error(errData.error || "Generation failed on API.");
      }
      const data = await apiRes.json();

      let foundImageUrl = false;
      let finalImageUrl = generatedImageUrl;
      if (data.base64) {
          const imageUrl = `data:image/png;base64,${data.base64}`;
          finalImageUrl = imageUrl;
          setGeneratedImageUrl(imageUrl);
          useAppStore.getState().setMediaCache("imageGen", imageUrl);
          foundImageUrl = true;
      }

      if (!foundImageUrl) {
         throw new Error("No image was returned from the API.");
      }

      const req = buildPow3rRequest("GENERATE_MEDIA", {
        target: "ImageGen",
        prompt,
        config: { aspectRatio, stylePreset, guidanceScale }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Image synthesis complete: ${data.prompt?.substring(0, 20)}...`,
          type: "Image Base",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `image_gen_${Date.now()}`,
        name: `Imagen3 (${res.data?.metadata?.stylePreset || "VISUAL"})`,
        loopCount: 2,
        volume: 0,
        fx: [],
        mediaRef: "imageGen"
      });
      
      if (finalImageUrl) {
         addGalleryItem({
            title: `Imagen3 (${stylePreset})`,
            type: "image",
            url: finalImageUrl,
            format: "img",
            tags: [stylePreset, "imagen3"],
            albums: [],
            metadata: { prompt, stylePreset, aspectRatio },
            sourcePageId: "image"
         });
      }
      
      toast.success("Generation Successful", { description: "Image layer added sequence track and Global Gallery." });
    } catch (e: any) {
      toast.error("Generation Failed");
      useAppStore.getState().addSystemLog(`error: Imagen generation failed: ${e.message || String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(ImageIcon, { className: "w-4 h-4" })} Image Gen
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
        {JSON.stringify({ component: "Image Gen", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">Image Generator (Imagen 3)</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Generative Visual Orchestrator</p>
        </div>
        <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> PROMPT BUILDER</div>
             <textarea 
               className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-300 font-sans text-[15px] leading-relaxed focus:outline-none focus:border-purple-500/50 resize-none custom-scrollbar"
               placeholder="Enter an image prompt..."
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
             />
             <div className="flex justify-between items-center mt-4">
               <div className="text-xs text-zinc-500">Model: <span className="text-purple-400">Imagen 3 Pro</span></div>
               <button onClick={handleGenerate} disabled={isProcessing} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-md text-xs font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isProcessing ? <><AlertTriangle className="w-4 h-4 animate-spin"/> GENERATING...</> : <><Play className="w-3 h-3 fill-white" /> GENERATE IMAGE</>}
               </button>
             </div>
           </div>
        </div>

        <div className="flex flex-col gap-4">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">IMAGE SETTINGS</div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>ASPECT RATIO</span>
                   <span className="text-purple-400 font-mono">{aspectRatio.split(' ')[0]}</span>
                 </div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
                   <option>16:9 (Cinematic)</option>
                   <option>1:1 (Square)</option>
                   <option>9:16 (Vertical)</option>
                   <option>4:3 (Classic)</option>
                 </select>
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>STYLE PRESET</span>
                   <span className="text-purple-400 font-mono">{stylePreset}</span>
                 </div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer" value={stylePreset} onChange={(e) => setStylePreset(e.target.value)}>
                   <option>PHOTOREALISTIC</option>
                   <option>CYBERPUNK</option>
                   <option>ANIME</option>
                   <option>CONCEPT ART</option>
                   <option>3D RENDER</option>
                 </select>
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>guidance scale</span>
                   <span className="text-purple-400 font-mono">{guidanceScale}</span>
                 </div>
                 <input type="range" className="w-full accent-purple-500" min="1" max="20" step="0.5" value={guidanceScale} onChange={(e) => setGuidanceScale(parseFloat(e.target.value))} />
               </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex items-center gap-2">
                 PREVIEW OUT
             </div>
             
             <div className="flex-1 bg-zinc-950 rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden min-h-[150px]">
                 {isProcessing ? (
                   <div className="flex flex-col items-center gap-3">
                     <AlertTriangle className="w-8 h-8 text-purple-500 animate-spin" />
                     <span className="text-[10px] text-purple-400 animate-pulse tracking-widest">RENDERING PIXELS...</span>
                   </div>
                 ) : generatedImageUrl ? (
                   <img src={generatedImageUrl} alt="Generated output" className="w-full h-full object-contain" />
                 ) : (
                   <div className="text-zinc-600 text-[10px] flex flex-col items-center gap-2">
                     <ImageIcon className="w-8 h-8 opacity-20" />
                     <span>No image generated</span>
                   </div>
                 )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
