import React, { useState } from "react";
import { Mic, Play, AlertTriangle } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { VolumetricDataVisualizer } from './visualizers/VolumetricDataVisualizer';
import { useGalleryStore } from "../services/galleryService";

export const MicRecorder = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);

  const [gain, setGain] = useState(12);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [lastRecording, setLastRecording] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGenerate = async () => {
    if (isProcessing) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
      setIsProcessing(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        // In a real app we'd upload this blob. Here we'll read it as a Data URI so it persists in the local DB.
        const reader = new FileReader();
        reader.onloadend = async () => {
            const audioUrl = reader.result as string;
            
            const req = buildPow3rRequest("UPDATE_PARAMETER", {
              target: "MicRecorder",
              config: { gain, size: audioBlob.size }
            });
            
            const res = await executePow3rWorkflow(req, async (data) => {
              return { 
                msg: `Recording complete: ${audioBlob.size} bytes`,
                type: "System Control",
                metadata: data.config
              };
            });
            appendLogs(res);
    
            const trackId = `mic_rec_${Date.now()}`;
            useAppStore.getState().setMediaCache(trackId, audioUrl);
    
            useAppStore.getState().addSequenceBlock({
              id: trackId,
              name: `Voice Take. Blob Size: ${audioBlob.size}`,
              loopCount: 4,
              volume: 80,
              fx: [],
              mediaRef: trackId,
              metadata: { size: audioBlob.size, gain }
            });
            
            addGalleryItem({
              title: `Mic Take`,
              type: "voice",
              url: audioUrl,
              format: "webm",
              tags: ["recording", "mic", `gain:${gain}`],
              albums: [],
              metadata: { gain, size: audioBlob.size },
              sourcePageId: "mic"
            });
            setLastRecording(audioUrl);
            toast.success("Recording Saved", { description: "Audio sample added to sequence and Global Gallery." });
            
            // Cleanup stream
            stream.getTracks().forEach(track => track.stop());
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setIsProcessing(true);
      toast.info("Recording...", { description: "Capturing audio input to engine" });

    } catch (e) {
      toast.error("Microphone Access Denied");
      useAppStore.getState().addSystemLog(`error: Mic access failed: ${String(e)}`, "error");
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Mic, { className: "w-4 h-4" })} Mic Recorder
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
        {JSON.stringify({ component: "Mic Recorder", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">Field Recorder</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">High-Fidelity Audio Acquisition</p>
        </div>
        <div className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] rounded animate-pulse">
           {isProcessing ? "RECORDING: HOT" : "MIC: STANDBY"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 flex-1 min-h-0">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full relative overflow-hidden">
             
           <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
               <span>WAVEFORM MONITOR</span>
               <span className="text-zinc-500">BUFFER: 4096</span>
           </div>

           <div className="flex-1 bg-zinc-950 rounded border border-zinc-800 relative flex items-center justify-center overflow-hidden group">
               {/* Center Line */}
               <div className="absolute left-0 right-0 h-[1px] bg-red-500/30 top-1/2"></div>
               
               {/* Waveform Generator Canvas */}
               <div className="absolute inset-0 flex items-center justify-center">
                   <VolumetricDataVisualizer isActive={isProcessing || !!lastRecording} intensity={(isProcessing ? 2.5 : 0.5) * (1 + gain / 36.0)} trackId={`mic_voice_${gain}_${lastRecording ? lastRecording.length : 'idel'}`} />
               </div>
               
               {/* Timecode overlay */}
               <div className="absolute top-4 font-mono text-3xl font-bold tracking-wider text-red-500 drop-shadow-[0_0_10px_#ef4444]">
                   {isProcessing ? "00:01:23:45" : "00:00:00:00"}
               </div>
           </div>
           
           <div className="mt-4 flex flex-col gap-2">
               <div className="flex justify-between text-[10px] text-zinc-500">
                   <span>L</span>
                   {isProcessing ? <span className="text-red-500">-3 dB</span> : <span>-inf</span>}
               </div>
               <div className="h-2 bg-zinc-950 rounded overflow-hidden flex">
                   <div className="h-full w-4/5 bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500" style={{ width: isProcessing ? '85%' : '0%' }}></div>
               </div>
               
               <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
                   <span>R</span>
                   {isProcessing ? <span className="text-red-500">-4 dB</span> : <span>-inf</span>}
               </div>
               <div className="h-2 bg-zinc-950 rounded overflow-hidden flex">
                   <div className="h-full w-4/5 bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500" style={{ width: isProcessing ? '80%' : '0%' }}></div>
               </div>
           </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">HARDWARE INTERFACE</div>
             
             <div className="space-y-4">
                 <div>
                     <div className="text-[10px] text-zinc-500 mb-1">INPUT DEVICE</div>
                     <select className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-2 cursor-pointer">
                       <option>Focusrite USB Audio (In 1/2)</option>
                       <option>MacBook Pro Microphone</option>
                       <option>Virtual Audio Cable</option>
                     </select>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <div className="text-[10px] text-zinc-500 mb-1">SAMPLE RATE</div>
                         <select defaultValue="48.0 kHz" className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer">
                           <option>44.1 kHz</option>
                           <option>48.0 kHz</option>
                           <option>96.0 kHz</option>
                         </select>
                     </div>
                     <div>
                         <div className="text-[10px] text-zinc-500 mb-1">BIT DEPTH</div>
                         <select defaultValue="24-bit" className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs p-1 cursor-pointer">
                           <option>16-bit</option>
                           <option>24-bit</option>
                           <option>32-bit float</option>
                         </select>
                     </div>
                 </div>

                 <div>
                     <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                       <span>INTERFACE GAIN</span>
                       <span className="text-red-400 font-mono">{gain > 0 ? `+${gain}` : gain} dB</span>
                     </div>
                     <input type="range" className="w-full accent-red-500" min="-12" max="36" value={gain} onChange={(e) => setGain(parseInt(e.target.value))} />
                 </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1 flex flex-col justify-between">
               <div>
                   <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">PROCESSING</div>
                   <div className="flex flex-col gap-2 text-[10px]">
                       <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-300 text-zinc-400">
                           <input type="checkbox" className="accent-red-500" defaultChecked />
                           LOW CUT (80Hz)
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-300 text-zinc-400">
                           <input type="checkbox" className="accent-red-500" />
                           PHASE INVERT
                       </label>
                       <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-300 text-zinc-400">
                           <input type="checkbox" className="accent-red-500" defaultChecked />
                           PEAK LIMITER (-0.3dB)
                       </label>
                   </div>
               </div>

               <div className="grid grid-cols-2 gap-2 mt-4">
                   <button onClick={() => {
                        if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
                        setIsProcessing(false);
                   }} disabled={!isProcessing} className="bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 p-3 rounded font-bold text-[10px] flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                       STOP
                   </button>
                   <button onClick={handleGenerate} disabled={isProcessing} className="bg-red-900/40 border border-red-500/50 hover:bg-red-800/60 text-red-200 p-3 rounded font-bold text-[10px] flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                       <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div> RECORD
                   </button>
               </div>
               
               {lastRecording && (
                   <div className="mt-4 border-t border-zinc-800 pt-4">
                       <div className="text-[10px] text-zinc-500 font-bold mb-2">PLAYBACK CONTROLLER</div>
                       <div className="flex gap-2">
                           <button onClick={() => {
                               if (audioRef.current) {
                                   audioRef.current.currentTime = 0;
                                   audioRef.current.play();
                                   setIsPlaying(true);
                               }
                           }} className="flex-1 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 p-2 rounded text-[10px] font-bold flex flex-col items-center gap-1 transition-all">
                               <Play className="w-4 h-4 fill-zinc-300" /> PLAY
                           </button>
                           <button onClick={() => {
                               if (audioRef.current) {
                                   audioRef.current.pause();
                                   setIsPlaying(false);
                               }
                           }} className="flex-1 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 p-2 rounded text-[10px] font-bold flex flex-col items-center gap-1 transition-all">
                               <div className="w-4 h-4 flex items-center justify-center gap-1"><div className="w-1 h-3 bg-zinc-300"></div><div className="w-1 h-3 bg-zinc-300"></div></div> PAUSE
                           </button>
                       </div>
                       <audio ref={audioRef} src={lastRecording} onEnded={() => setIsPlaying(false)} className="hidden" />
                   </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};
