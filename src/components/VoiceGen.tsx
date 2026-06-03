import React, { useState } from "react";
import { Mic, Play, AlertTriangle, Loader2 } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { GoogleGenAI, Modality } from "@google/genai";
import { useGalleryStore } from "../services/galleryService";

const createAudioUrl = (base64String: string, mimeType: string): string => {
  const binaryString = atob(base64String);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  if (mimeType.includes("pcm")) {
      const sampleRate = 24000;
      const dataLength = bytes.length % 2 === 0 ? bytes.length : bytes.length - 1;
      const buffer = new ArrayBuffer(44 + dataLength);
      const view = new DataView(buffer);

      const writeString = (v: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            v.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + dataLength, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM Format
      view.setUint16(22, 1, true); // Channels
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); // Byte rate
      view.setUint16(32, 2, true); // Block align
      view.setUint16(34, 16, true); // Bits per sample
      writeString(view, 36, 'data');
      view.setUint32(40, dataLength, true);

      new Uint8Array(buffer, 44, dataLength).set(bytes.subarray(0, dataLength));
      
      const wavUint8 = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < wavUint8.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, wavUint8.subarray(i, i + chunkSize) as any);
      }
      return `data:audio/wav;base64,${btoa(binary)}`;
  }

  // Generic mime type Data URI
  return `data:${mimeType || 'audio/wav'};base64,${base64String}`;
};

export const VoiceGen = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const mediaCache = useAppStore((state) => state.mediaCache);
  const setMediaCache = useAppStore((state) => state.setMediaCache);
  const addGalleryItem = useGalleryStore(state => state.addItem);

  const [isProcessing, setIsProcessing] = useState(false);

  const [prompt, setPrompt] = useState("Hello, and welcome to Pow3r Platform. I am your neural voice assistant, ready to narrate any workflow or video you create.");
  const [stability, setStability] = useState(75);
  const [clarity, setClarity] = useState(85);
  const [activeVoice, setActiveVoice] = useState("Kore");

  const generatedAudio = mediaCache["voiceGen"] || null;

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Synthesizing Voice...", { description: "Sending payload to Gemini TTS via Pow3r" });
    
    try {
      const response = await fetch("/api/generate-tts", {
         method: "POST",
         headers: {
             "Content-Type": "application/json"
         },
         body: JSON.stringify({
             prompt,
             voiceName: activeVoice,
             stability,
             clarity
         })
      });

      if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "TTS Generation failed on API.");
      }

      const data = await response.json();
      
      let finalAudioUrl = generatedAudio || "";
      const base64Audio = data.base64Audio;
      const mimeType = data.mimeType;
      
      if (base64Audio) {
        finalAudioUrl = createAudioUrl(base64Audio, mimeType);
        setMediaCache("voiceGen", finalAudioUrl);
      }

      const req = buildPow3rRequest("GENERATE_MEDIA", {
        target: "VoiceGen",
        prompt,
        config: { stability, clarity, activeVoice }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Neural TTS complete: ${data.prompt?.substring(0, 20)}...`,
          type: "Audio Base",
          metadata: data.config
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `voice_gen_${Date.now()}`,
        name: `Neural TTS Setup (${activeVoice})`,
        loopCount: 4,
        volume: 90,
        fx: [],
        mediaRef: "voiceGen",
        metadata: { prompt, stability, clarity, activeVoice }
      });
      
      if (finalAudioUrl) {
         addGalleryItem({
            title: `TTS (${activeVoice})`,
            type: "voice",
            url: finalAudioUrl,
            format: "wav",
            tags: [activeVoice, "tts"],
            albums: [],
            metadata: { prompt, stability, clarity, activeVoice },
            sourcePageId: "voice"
         });
      }
      
      toast.success("Synthesis Successful", { description: "Added TTS layer to sequencer and Global Gallery." });
    } catch (e: any) {
      toast.error("Generation Failed");
      useAppStore.getState().addSystemLog(`error: TTS generation failed: ${e.message || String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Mic, { className: "w-4 h-4" })} Voice Gen
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
        {JSON.stringify({ component: "Voice Gen", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">Voice Generator (ElevenLabs)</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Neural TTS & Voice Cloning</p>
        </div>
        <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 flex items-center gap-2"><Mic className="w-4 h-4"/> SCRIPT EDITOR</div>
             <textarea 
               className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-300 font-sans text-[15px] leading-relaxed focus:outline-none focus:border-orange-500/50 resize-none custom-scrollbar"
               placeholder="Type the script here..."
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
             />
             <div className="flex justify-between items-center mt-4">
               <div className="text-xs text-zinc-500">Character count: <span className="text-orange-400">{prompt.length}</span></div>
               <div className="flex items-center gap-4">
                 {generatedAudio && (
                   <audio src={generatedAudio} controls className="h-8 w-48 opacity-80" />
                 )}
                 <button onClick={handleGenerate} disabled={isProcessing} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-md text-xs font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                    {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin"/> GENERATING...</> : <><Play className="w-3 h-3 fill-white" /> GENERATE VOICE</>}
                 </button>
               </div>
             </div>
           </div>
        </div>

        <div className="flex flex-col gap-4">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between items-center">
               <span>VOICE SELECTION</span>
               <button onClick={() => toast.info("Voice Cloning requires Agent Builder upgrade", { description: "Please upgrade to Edge Tier 2" })} className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-orange-400 px-2 py-0.5 rounded border border-zinc-700 transition-colors">
                 + CLONE VOICE
               </button>
             </div>
             <div className="flex flex-col gap-2">
                {[
                  { id: "Kore", label: "Kore (Narrative)", desc: "Deep, clear, American" },
                  { id: "Puck", label: "Puck (Conversational)", desc: "Calm, natural, Neutral" },
                  { id: "Aoede", label: "Aoede (Energetic)", desc: "Upbeat, energetic" }
                ].map(voice => (
                  <div 
                    key={voice.id}
                    onClick={() => setActiveVoice(voice.id)}
                    className={`p-3 rounded flex items-center justify-between cursor-pointer transition-colors ${
                      activeVoice === voice.id 
                        ? "border border-orange-500/50 bg-orange-500/10" 
                        : "border border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold ${activeVoice === voice.id ? "text-orange-400" : "text-zinc-500"}`}>
                        {voice.id.charAt(0)}
                      </div>
                      <div>
                        <div className={`text-xs font-sans font-bold ${activeVoice === voice.id ? "text-zinc-200" : "text-zinc-400"}`}>{voice.label}</div>
                        <div className={`text-[9px] ${activeVoice === voice.id ? "text-zinc-500" : "text-zinc-600"}`}>{voice.desc}</div>
                      </div>
                    </div>
                    {activeVoice === voice.id && <div className="text-[10px] text-orange-400">ACTIVE</div>}
                  </div>
                ))}
                
                <div className="border border-zinc-800 bg-zinc-950 p-3 rounded flex items-center justify-between cursor-pointer hover:border-zinc-700 border-dashed">
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 border-dashed flex items-center justify-center text-xs font-bold text-zinc-500">+</div>
                    <div>
                      <div className="text-zinc-400 text-xs font-sans font-bold">Custom Upload (1.2mb)</div>
                      <div className="text-[9px] text-zinc-600">User cloned voice</div>
                    </div>
                  </div>
                </div>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex-1">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800">VOICE SETTINGS</div>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>STABILITY</span>
                   <span className="text-orange-400 font-mono">{stability}%</span>
                 </div>
                 <input type="range" className="w-full accent-orange-500" min="0" max="100" value={stability} onChange={(e) => setStability(parseInt(e.target.value))} />
                 <div className="text-[8px] text-zinc-600 mt-1">Higher stability minimizes fluctuations but limits emotion.</div>
               </div>
               
               <div>
                 <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
                   <span>CLARITY + SIMILARITY</span>
                   <span className="text-orange-400 font-mono">{clarity}%</span>
                 </div>
                 <input type="range" className="w-full accent-orange-500" min="0" max="100" value={clarity} onChange={(e) => setClarity(parseInt(e.target.value))} />
                 <div className="text-[8px] text-zinc-600 mt-1">High clarity removes artifacts.</div>
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
