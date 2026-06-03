import { proxyGenerateText } from "../services/geminiService";
import React, { useState } from "react";
import { User, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { useGalleryStore } from "../services/galleryService";

export const VideoTracking = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [confidence, setConfidence] = useState(85);
  const [smoothing, setSmoothing] = useState(80);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [generatedRigData, setGeneratedRigData] = useState<string | null>(null);

  React.useEffect(() => {
    return () => {
       if (mediaStream) {
          mediaStream.getTracks().forEach(t => t.stop());
       }
    }
  }, [mediaStream]);

  const handleToggleScan = async () => {
    if (isScanning) {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      setIsScanning(false);
      return;
    }

    setIsProcessing(true);
    toast.info("Initializing Sensors...", { description: "Establishing connection to Pow3r tracking array" });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);

      // We need to wait for the video element to be attached to play it
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
      
      setIsScanning(true);

      const currentConfig = `Confidence: ${confidence}, Smoothing: ${smoothing}`;
      const response = await proxyGenerateText(`Generate a brief JSON string representing 3 keypoint locations (nose, left_eye, right_eye) in screen space coordinates. Config: ${currentConfig}. No markdown, just JSON.`);

      const textOutput = response || "{}";
      setGeneratedRigData(textOutput);

      const req = buildPow3rRequest("UPDATE_PARAMETER", {
        target: "VideoTracking",
        config: { confidence, smoothing, rigData: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Sensors locked`,
          type: "System Control",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `mocap_link_${Date.now()}`,
        name: `Live Mocap Feed`,
        loopCount: 4,
        volume: 0,
        fx: []
      });
      
      const configObj = { confidence, smoothing, rigData: textOutput };
      addGalleryItem({
         title: `Video Tracking Data`,
         type: "json",
         url: `data:application/json;base64,${btoa(JSON.stringify(configObj))}`,
         format: "json",
         tags: ["mocap", "tracking", "video", "rig"],
         albums: [],
         metadata: configObj,
         sourcePageId: "tracking"
      });
      
      toast.success("Recording Active", { description: "Motion data streaming to sequencer and Global Gallery." });
    } catch (e) {
      toast.error("Initialization Failed");
      useAppStore.getState().addSystemLog(`error: Mocap initialization failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(User, { className: "w-4 h-4" })} Video Tracking
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
        {JSON.stringify({ component: "Video Tracking", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]">Optical MoCap & Tracking</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Post-Estimation & Kinematics AI</p>
        </div>
        <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">TRACKING PIPELINE</div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>ALGORITHM</span>
                   <span className="text-sky-400 font-mono">MEDIAPIPE</span>
                 </div>
                 <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer">
                   <option>MediaPipe Holistic</option>
                   <option>YOLO-Pose</option>
                   <option>OpenPose</option>
                   <option>ARKit FaceBlendshapes</option>
                 </select>
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>DETECTION CONFIDENCE</span>
                   <span className="text-sky-400 font-mono">{(confidence / 100).toFixed(2)}</span>
                 </div>
                 <input type="range" className="w-full accent-sky-500" min="0" max="100" value={confidence} onChange={(e) => setConfidence(parseInt(e.target.value))} />
               </div>

               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>SMOOTHING (EMA)</span>
                   <span className="text-sky-400 font-mono">{smoothing > 66 ? 'HIGH' : smoothing > 33 ? 'MED' : 'LOW'}</span>
                 </div>
                 <input type="range" className="w-full accent-sky-500" min="0" max="100" value={smoothing} onChange={(e) => setSmoothing(parseInt(e.target.value))} />
               </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">ACTIVE SENSORS / CAMERAS</div>
             <div className="space-y-3">
                 <div className="flex items-center justify-between bg-zinc-950 border border-sky-500/50 rounded px-3 py-2">
                     <span className="text-[10px] text-sky-400 font-bold">CAM 01 - FRONT CENTER</span>
                     <span className="text-[9px] text-zinc-500">1080p60</span>
                 </div>
                 <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded px-3 py-2 opacity-50">
                     <span className="text-[10px] text-zinc-400 font-bold">CAM 02 - OVERHEAD</span>
                     <span className="text-[9px] text-zinc-500">OFFLINE</span>
                 </div>
             </div>
             
             <button onClick={handleToggleScan} disabled={isProcessing} className="w-full mt-6 bg-sky-900/40 border border-sky-500/50 hover:bg-sky-800/60 text-sky-200 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isProcessing ? "INITIALIZING SENSORS..." : isScanning ? "STOP TRACKING" : <><User className="w-4 h-4" /> BEGIN MOCAP SESSION</>}
             </button>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full">
           <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2 text-center w-full justify-center">CAMERA FEED: <span className={isScanning ? "text-sky-500 animate-pulse" : "text-zinc-600"}>{isScanning ? "LIVE" : "OFFLINE"}</span></div>
           <div className="flex-1 bg-zinc-950 rounded-lg border border-zinc-800 relative flex items-center justify-center overflow-hidden">
               {mediaStream ? (
                  <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-50" />
               ) : (
                  <div className="absolute inset-0 bg-[#0f172a] mix-blend-screen opacity-50"></div>
               )}
               
               {/* Skeleton Wireframe */}
               <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${isScanning ? 'opacity-100' : 'opacity-20'}`}>
                   <div className="relative w-[200px] h-[400px]">
                       {/* Head */}
                       <div className="absolute top-10 left-1/2 -translate-x-1/2 w-16 h-20 border-2 border-sky-500 rounded-full animate-pulse shadow-[0_0_10px_#38bdf8]">
                           {/* Eyes mapping */}
                           {isScanning && (
                               <div className="absolute top-6 w-full flex justify-center gap-4">
                                   <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                   <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                               </div>
                           )}
                       </div>
                       
                       {/* Spine */}
                       <div className="absolute top-[120px] left-1/2 -translate-x-1/2 w-[2px] h-[100px] bg-sky-500"></div>
                       
                       {/* Shoulders */}
                       <div className="absolute top-[120px] left-1/2 -translate-x-1/2 w-[120px] h-[2px] bg-sky-500"></div>

                       {/* Arms */}
                       <div className="absolute top-[120px] left-[40px] w-[2px] h-[80px] bg-sky-500 -rotate-12 transform origin-top"></div>
                       <div className="absolute top-[120px] right-[40px] w-[2px] h-[80px] bg-sky-500 rotate-12 transform origin-top"></div>

                       {/* Hips */}
                       <div className="absolute top-[220px] left-1/2 -translate-x-1/2 w-[80px] h-[2px] bg-sky-500"></div>

                       {/* Legs */}
                       <div className="absolute top-[220px] left-[60px] w-[2px] h-[100px] bg-sky-500 rotate-6 transform origin-top"></div>
                       <div className="absolute top-[220px] right-[60px] w-[2px] h-[100px] bg-sky-500 -rotate-6 transform origin-top"></div>

                       {/* Joints */}
                       {[
                           { top: '116px', left: '36px' }, { top: '116px', left: '156px' },
                           { top: '196px', left: '20px' }, { top: '196px', left: '172px' },
                           { top: '216px', left: '56px' }, { top: '216px', left: '136px' },
                           { top: '316px', left: '46px' }, { top: '316px', left: '146px' }
                       ].map((joint, i) => (
                           <div key={i} className="absolute w-3 h-3 bg-white border border-sky-400 rounded-full shadow-[0_0_8px_white]" style={{ top: joint.top, left: joint.left }}></div>
                       ))}
                   </div>
               </div>

               {isProcessing && (
                  <div className="absolute top-4 left-4 flex flex-col gap-1">
                      <div className="text-[8px] text-green-400 font-bold bg-black/60 px-2 rounded">TRACKING CONFIDENCE: 92%</div>
                      <div className="text-[8px] text-green-400 font-bold bg-black/60 px-2 rounded">FRAME LATENCY: 12ms</div>
                  </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};
