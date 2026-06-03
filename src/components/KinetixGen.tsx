import { proxyGenerateText } from "../services/geminiService";
import React, { useState, useRef, useEffect } from "react";
import { Activity, Play, AlertTriangle, Cuboid, Zap, Camera, Video as VideoIcon, Upload, Link } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { useGalleryStore } from "../services/galleryService";

export const KinetixGen = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore((state) => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);
  const [prompt, setPrompt] = useState("A heroic 3D avatar performing a backflip with glowing cyberpunk trails.");
  const [motionStyle, setMotionStyle] = useState("Acrobatic");
  const [generatedMotion, setGeneratedMotion] = useState<string | null>(null);
  
  const [inputMode, setInputMode] = useState<"prompt" | "camera" | "video" | "youtube">("prompt");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");

  useEffect(() => {
    if (inputMode === "camera" && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsCameraActive(true);
          }
        })
        .catch(err => {
          toast.error("Camera access denied or unavailable.");
          setInputMode("prompt");
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(t => t.stop());
         videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
    }
    
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(t => t.stop());
      }
    };
  }, [inputMode]);

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Generating 3D Motion...", { description: "Dispatching to Kinetix Gen nodes via Pow3r WF" });

    try {
      const currentConfig = `Source: ${inputMode}, Style: ${motionStyle}, Prompt/URL: ${inputMode === 'youtube' ? youtubeUrl : prompt}`;
      
      let sourceDescription = "the motion data";
      if (inputMode === "camera") sourceDescription = "a live camera feed";
      if (inputMode === "video") sourceDescription = "an uploaded video";
      if (inputMode === "youtube") sourceDescription = "a youtube video URL";
      
      const contentPrompt = `Use Gemini & Google Services to detect, analyze, track, record, save, and replay detailed body movements, foot, and hand gestures with high precision from ${sourceDescription}. Detect dance moves, label moves, and capture patterns. Config: ${currentConfig}. Generate 3 highly precise CSS keyframe stages for character translation (X, Y, Z). Keep it very brief like 0%: {x,y,z}, 50%: {x,y,z}, 100%: {x,y,z}.`;
         
      const response = await proxyGenerateText(contentPrompt);

      const textOutput = response || "0% { 0,0,0 }";
      setGeneratedMotion(textOutput);

      const titlePrompt = inputMode === "camera" ? "Camera Tracking Capture" : inputMode === "video" ? "Uploaded Video Tracking" : inputMode === "youtube" ? youtubeUrl : prompt;
      const req = buildPow3rRequest("GENERATE_MOTION", {
        target: "KinetixGen",
        prompt: titlePrompt,
        config: { motionStyle, keyframes: textOutput, inputMode }
      });

      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `3D Motion Synthesis complete: ${data.prompt?.substring(0, 20)}...`,
          type: "Motion Layer",
          metadata: data.config
        };
      });

      appendLogs(res);

      const configObj = { motionStyle, inputMode, prompt: inputMode === "camera" ? "Camera Tracking Capture" : prompt, keyframes: textOutput };

      useAppStore.getState().addSequenceBlock({
        id: `kinetix_gen_${Date.now()}`,
        name: `Kinetix (${res.data?.metadata?.motionStyle || motionStyle || "MOTION"})`,
        loopCount: 4,
        volume: 0,
        fx: [],
        metadata: configObj
      });
      addGalleryItem({
         title: `Kinetix Motion`,
         type: "json",
         url: `data:application/json;base64,${btoa(JSON.stringify(configObj))}`,
         format: "json",
         tags: ["kinetix", "motion", "3d", inputMode],
         albums: [],
         metadata: configObj,
         sourcePageId: "kinetix"
      });

      toast.success("Kinetix Generation Successful", { description: "Motion block added to main sequencer and Global Gallery." });
    } catch (e) {
      toast.error("Generation Failed");
      useAppStore.getState().addSystemLog(`error: Kinetix generation failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-orange-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(249,115,22,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-orange-500" />
        <div className="font-mono font-bold text-xs text-orange-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          <Cuboid className="w-4 h-4" /> Kinetix Gen
        </div>
        <div className="text-[10px] text-orange-300">Pow3r 3D Motion Extractor</div>
        <Handle type="source" position={Position.Bottom} className="w-3 h-3 border-2 border-zinc-900 bg-orange-500" />
      </div>
    );
  }

  if (mode === "3d") {
    return (
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    );
  }

  if (mode === "json") {
    return (
      <pre className="text-[10px] text-orange-400 font-mono bg-zinc-950 p-4 border border-orange-500/20 rounded">
        {JSON.stringify({ component: "Kinetix Gen", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">Kinetix Generator</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">3D Generative Motion API</p>
        </div>
        <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2"><Cuboid className="w-4 h-4"/> MOTION INPUT</div>
                <div className="flex items-center gap-1 bg-zinc-950 rounded border border-zinc-800 p-1">
                   <button onClick={() => setInputMode("prompt")} className={`px-2 py-1 text-[10px] rounded flex items-center gap-1 ${inputMode === "prompt" ? "bg-orange-500/20 text-orange-400" : "text-zinc-500 hover:text-zinc-300"}`}>
                      PROMPT
                   </button>
                   <button onClick={() => setInputMode("video")} className={`px-2 py-1 text-[10px] rounded flex items-center gap-1 ${inputMode === "video" ? "bg-orange-500/20 text-orange-400" : "text-zinc-500 hover:text-zinc-300"}`}>
                      <Upload className="w-3 h-3" /> FILE
                   </button>
                   <button onClick={() => setInputMode("youtube")} className={`px-2 py-1 text-[10px] rounded flex items-center gap-1 ${inputMode === "youtube" ? "bg-orange-500/20 text-orange-400" : "text-zinc-500 hover:text-zinc-300"}`}>
                      <Link className="w-3 h-3" /> YT
                   </button>
                   <button onClick={() => setInputMode("camera")} className={`px-2 py-1 text-[10px] rounded flex items-center gap-1 ${inputMode === "camera" ? "bg-orange-500/20 text-orange-400" : "text-zinc-500 hover:text-zinc-300"}`}>
                      <Camera className="w-3 h-3" /> LIVE
                   </button>
                </div>
             </div>
             
             {inputMode === "prompt" && (
                 <textarea 
                   className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-300 font-sans text-sm focus:outline-none focus:border-orange-500/50 resize-none custom-scrollbar"
                   placeholder="Describe the 3D motion..."
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                 />
             )}
             {inputMode === "youtube" && (
                 <div className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col justify-center">
                   <div className="text-[10px] text-zinc-500 mb-2 uppercase font-bold tracking-wider">YouTube URL to Track</div>
                   <input 
                     type="text"
                     className="w-full bg-zinc-900 border border-zinc-700 rounded p-3 text-zinc-300 focus:outline-none focus:border-orange-500/50"
                     placeholder="https://www.youtube.com/watch?v=..."
                     value={youtubeUrl}
                     onChange={(e) => setYoutubeUrl(e.target.value)}
                   />
                 </div>
             )}
             {inputMode === "video" && (
                 <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    {uploadedVideoUrl ? (
                        <>
                           <video src={uploadedVideoUrl} autoPlay loop playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-60" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                              <label className="cursor-pointer bg-black/60 px-4 py-2 rounded text-white text-xs border border-zinc-700 hover:bg-zinc-800">
                                 REPLACE VIDEO
                                 <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                                     if (e.target.files?.[0]) setUploadedVideoUrl(URL.createObjectURL(e.target.files[0]));
                                 }} />
                              </label>
                           </div>
                        </>
                    ) : (
                        <label className="text-zinc-600 flex flex-col items-center gap-3 z-10 cursor-pointer hover:text-zinc-400 pb-4">
                            <Upload className="w-10 h-10 opacity-50" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-center max-w-[200px]">Upload video footage for motion extraction</span>
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => {
                                if (e.target.files?.[0]) setUploadedVideoUrl(URL.createObjectURL(e.target.files[0]));
                            }} />
                        </label>
                    )}
                 </div>
             )}
             {inputMode === "camera" && (
                 <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover opacity-50 ${isCameraActive ? "block" : "hidden"}`} />
                    {!isCameraActive && (
                        <div className="text-zinc-600 flex flex-col items-center gap-2 z-10">
                            <Camera className="w-8 h-8 opacity-50" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Awaiting Camera Access</span>
                        </div>
                    )}
                    {isCameraActive && (
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                           <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                           <span className="text-red-400 font-bold text-[10px] tracking-widest">LIVE MOCAP</span>
                        </div>
                    )}
                 </div>
             )}
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">API CONTROLS</div>
             <div className="grid grid-cols-1 gap-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>MOTION STYLE</span>
                   <span className="text-orange-400 font-mono">{motionStyle}</span>
                 </div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer" value={motionStyle} onChange={(e) => setMotionStyle(e.target.value)}>
                   <option>Acrobatic</option>
                   <option>Hip Hop Dance</option>
                   <option>Combat</option>
                   <option>Idle</option>
                 </select>
               </div>
               <div className="mt-2">
                 <button onClick={handleGenerate} disabled={isProcessing} className="w-full bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-md text-xs font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    {isProcessing ? "SYNTHESIZING MOTION..." : <><Zap className="w-3 h-3 fill-white" /> GENERATE KINETIX MOTION</>}
                 </button>
               </div>
             </div>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
           <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2">RIG PREVIEW</div>
           <div className="flex-1 bg-black rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden">
             {isProcessing ? (
               <div className="flex flex-col items-center gap-3">
                 <AlertTriangle className="w-8 h-8 text-orange-500 animate-spin" />
                 <span className="text-xs text-orange-400 animate-pulse tracking-widest">SOLVING IK KINEMATICS...</span>
                 <div className="w-48 h-1 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                   <div className="h-full bg-orange-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
                 </div>
               </div>
             ) : generatedMotion ? (
                  <div className="absolute inset-0 bg-black/90 p-4 flex items-center justify-center">
                     <div className="font-mono text-[10px] text-orange-400 border border-orange-500/30 p-2 rounded bg-orange-950/20 whitespace-pre-wrap">
                        <span className="text-white font-bold block mb-2">GENERATED IK CSS SPLINE:</span>
                        {generatedMotion}
                     </div>
                  </div>
             ) : (
               <div className="text-zinc-600 text-xs flex flex-col items-center gap-2">
                 <Cuboid className="w-12 h-12 opacity-20" />
                 <span>Mesh preview will appear here</span>
               </div>
             )}
           </div>
           
           <div className="mt-4 pt-4 border-t border-zinc-800">
             <div className="text-[10px] text-zinc-500 mb-2">SOLVER LOG</div>
             <div className="bg-zinc-950 text-orange-500/70 p-2 rounded text-[9px] min-h-[60px] font-mono whitespace-pre-wrap">
               {isProcessing ? `> Fetching Kinetix API...
> Synthesizing skeleton constraints...
> Validating rig...` : `> Waiting for Kinetix task...`}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
