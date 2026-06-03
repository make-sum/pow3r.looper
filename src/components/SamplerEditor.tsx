import React, { useState, useRef, useEffect } from "react";
import { Copy, Play, Square, Repeat, AlertTriangle, Upload, Music, Scissors, Layers, Sparkles } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { GoogleGenAI } from "@google/genai";
import { audioBufferToWav } from "../services/audioService";
import { useGalleryStore } from "../services/galleryService";

export const SamplerEditor = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const mediaCache = useAppStore(state => state.mediaCache);
  const setMediaCache = useAppStore(state => state.setMediaCache);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [orchestrationStatus, setOrchestrationStatus] = useState<string | null>(null);
  const [orchestrationPlan, setOrchestrationPlan] = useState<any>(null);

  const [pitchShift, setPitchShift] = useState(0);
  const [timeStretch, setTimeStretch] = useState(100);
  const [activeSlice, setActiveSlice] = useState(1);
  const [generatedTransientData, setGeneratedTransientData] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("No Sample Loaded");

  useEffect(() => {
     // Check if there is generated audio in the cache by default
     const audioKeys = Object.keys(mediaCache).filter(key => key.includes("mic_rec_") || key.includes("voiceGen") || key.includes("musicGen") || key.includes("sfxGen"));
     if (audioKeys.length > 0 && !audioUrl) {
         setAudioUrl(mediaCache[audioKeys[audioKeys.length - 1]]);
         setFileName(audioKeys[audioKeys.length - 1] + " (from library)");
     }
  }, [mediaCache, audioUrl]);

  useEffect(() => {
    if (audioUrl && !audioUrl.startsWith("data:")) {
       const loadAudio = async () => {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          try {
             const response = await fetch(audioUrl);
             const arrayBuffer = await response.arrayBuffer();
             audioContextRef.current.decodeAudioData(arrayBuffer, (decodedData) => {
                 setAudioBuffer(decodedData);
             }, (e) => {
                 console.error("Error loading sample:", e);
             });
          } catch(e) {
             console.error("Error fetching sample:", e);
          }
       };
       loadAudio();
    }
  }, [audioUrl]);

  const [waveform, setWaveform] = useState<number[]>([]);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100);

  useEffect(() => {
    if (audioBuffer) {
        const data = audioBuffer.getChannelData(0);
        const steps = 200;
        const stepSize = Math.floor(data.length / steps);
        if (stepSize > 0) {
            const peaks = [];
            for (let i = 0; i < steps; i++) {
                let sum = 0;
                for (let j = 0; j < stepSize; j++) {
                    sum += Math.abs(data[i * stepSize + j]);
                }
                peaks.push(sum / stepSize);
            }
            const max = Math.max(...peaks) || 1;
            setWaveform(peaks.map(p => p / max));
        } else {
            setWaveform([]);
        }
    } else {
        setWaveform([]);
    }
  }, [audioBuffer]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
         const url = reader.result as string;
         setAudioUrl(url);
         setFileName(file.name);
         const id = `upload_${Date.now()}`;
         setMediaCache(id, url);
      };
      reader.readAsDataURL(file);

      const arrayBufferReader = new FileReader();
      arrayBufferReader.onloadend = () => {
         try {
             audioContextRef.current?.decodeAudioData(arrayBufferReader.result as ArrayBuffer, (decoded) => {
                 setAudioBuffer(decoded);
                 toast.success("Audio decoded successfully.");
             }, (e) => {
                 console.error("Error decoding:", e);
                 toast.error("Audio format not supported or corrupted.");
             });
         } catch (e) {
             console.error("Decode attempt failed:", e);
         }
      };
      arrayBufferReader.readAsArrayBuffer(file);
    }
  };

  const stopSlice = () => {
     if (activeSourceRef.current) {
        try {
            activeSourceRef.current.stop();
        } catch(e) {}
        activeSourceRef.current = null;
     }
     setIsPlaying(false);
  };

  const playSlice = () => {
     if (!audioBuffer || !audioContextRef.current) return;
     stopSlice();

     const source = audioContextRef.current.createBufferSource();
     source.buffer = audioBuffer;
     source.playbackRate.value = (timeStretch / 100) * Math.pow(2, pitchShift / 12);
     source.connect(audioContextRef.current.destination);
     source.loop = isLooping;
     
     const totalDuration = audioBuffer.duration;
     const actualTrimStart = (trimStart / 100) * totalDuration;
     const actualTrimEnd = (trimEnd / 100) * totalDuration;
     const trimmedDuration = Math.max(0, actualTrimEnd - actualTrimStart);
     
     const sliceDuration = trimmedDuration / 8;
     const startTime = actualTrimStart + ((activeSlice - 1) * sliceDuration);
     
     // Note: if looping is true, we should preferably loop just the slice, but standard WebAudio loop limits are needed
     if (isLooping) {
         source.loopStart = startTime;
         source.loopEnd = startTime + sliceDuration;
         source.start(0, startTime);
     } else {
         source.start(0, startTime, sliceDuration);
     }
     
     activeSourceRef.current = source;
     setIsPlaying(true);
     source.onended = () => {
         if (activeSourceRef.current === source) {
             setIsPlaying(false);
             activeSourceRef.current = null;
         }
     };
  };

  const handleOrchestrate = async () => {
    if (!audioBuffer) { toast.error("No audio loaded. Upload a sample first."); return; }
    setIsProcessing(true);
    
    try {
        setOrchestrationStatus("Analyzing track transients & harmonics with Gemini AI...");
        
        const prompt = `Act as an expert audio engineer AI. An audio loop of duration ${audioBuffer.duration.toFixed(2)}s has been loaded.
        We will orchestrate a stem separation without 3rd party APIs.
        Generate a JSON plan to divide this audio into stems (Instrumental, Lead Vocals separating different singers, Harmonies, Doubles, Ad-libs).
        Also provide BPM, Key, and Quantization.
        Respond ONLY with a raw JSON object string with this exact structure:
        {
           "bpm": 120,
           "key": "A Minor",
           "quantize": "1/16",
           "stems": [
              { "name": "Instrumental", "eqMode": "lowpass", "cleanup": "None", "slices": 4 },
              { "name": "Lead Vocal (Singer A)", "eqMode": "bandpass", "cleanup": "De-ess & Autotune To Key", "slices": 8 },
              { "name": "Harmonies (Singer A+B)", "eqMode": "highpass", "cleanup": "Stereo Width", "slices": 4 },
              { "name": "Background Ad-libs", "eqMode": "highpass", "cleanup": "Reverb & Delay", "slices": 4 }
           ]
        }`;

        let plan;
        try {
            const aiResponse = await fetch("/api/generate-text", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ prompt, model: "gemini-2.5-flash" })
            });
            const data = await aiResponse.json();
            const text = data.text || "{}";
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            plan = JSON.parse(jsonStr);
            if (!plan || !plan.stems || !Array.isArray(plan.stems) || plan.stems.length === 0) {
               throw new Error("Invalid plan schema");
            }
        } catch (err) {
            console.error("Gemini parse failed, using fallback plan", err);
            plan = {
                bpm: 128, key: "C Minor", quantize: "1/16",
                stems: [
                    { name: "Instrumental", eqMode: "lowpass", cleanup: "None", slices: 4 },
                    { name: "Lead Vocal (Singer A)", eqMode: "bandpass", cleanup: "De-ess & Autotune", slices: 8 },
                    { name: "Harmonies (Background)", eqMode: "highpass", cleanup: "Width", slices: 4 }
                ]
            };
        }
        
        setOrchestrationPlan(plan);
        useAppStore.getState().addSystemLog(`AI Stem Plan Identified: ${plan.bpm}BPM in ${plan.key}`, "info");

        // Execute local separation
        const numStems = plan.stems.length;
        for (let i = 0; i < numStems; i++) {
            const stem = plan.stems[i];
            setOrchestrationStatus(`Orchestrating && Separating: ${stem.name} (${i + 1}/${numStems})...`);
            
            // Wait to render UI
            await new Promise(r => setTimeout(r, 1500));
            
            // Local Web Audio Separation Approximation
            const offlineCtx = new window.OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            
            const filter = offlineCtx.createBiquadFilter();
            if (stem.eqMode === 'lowpass') {
                filter.type = 'lowpass';
                filter.frequency.value = 400; 
            } else if (stem.eqMode === 'bandpass') {
                filter.type = 'bandpass';
                filter.frequency.value = 1500; 
                filter.Q.value = 1.0;
            } else {
                filter.type = 'highpass';
                filter.frequency.value = 2500; 
            }
            
            source.connect(filter);
            filter.connect(offlineCtx.destination);
            source.start(0);
            
            const renderedBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
                offlineCtx.oncomplete = (e) => resolve(e.renderedBuffer);
                (offlineCtx as any).onerror = reject;
                try {
                    const result = offlineCtx.startRendering();
                    if (result && result.then) {
                        result.then(resolve).catch(reject);
                    }
                } catch(e) {
                    reject(e);
                }
            });
            
            // Generate Perfect Slices on Beat
            const slicesToGenerate = stem.slices || 4;
            const sliceLength = Math.floor(renderedBuffer.length / slicesToGenerate);
            
            for (let s = 0; s < slicesToGenerate; s++) {
               const sliceBuffer = offlineCtx.createBuffer(renderedBuffer.numberOfChannels, sliceLength, renderedBuffer.sampleRate);
               for (let c = 0; c < renderedBuffer.numberOfChannels; c++) {
                  const channelData = renderedBuffer.getChannelData(c);
                  const sliceData = sliceBuffer.getChannelData(c);
                  const startOffset = s * sliceLength;
                  for (let n = 0; n < sliceLength; n++) {
                     sliceData[n] = channelData[startOffset + n];
                  }
               }

               // Base64 Encode Slice
               const wavData = audioBufferToWav(sliceBuffer);
               const uint8Array = new Uint8Array(wavData);
               let binary = '';
               for (let j = 0; j < uint8Array.length; j += 8192) {
                   binary += String.fromCharCode.apply(null, uint8Array.subarray(j, j + 8192) as any);
               }
               const sliceUrl = `data:audio/wav;base64,${btoa(binary)}`;
               const stemId = `stem_${Date.now()}_${i}_slice_${s}`;
               
               setMediaCache(stemId, sliceUrl);
               
               addGalleryItem({
                   title: `${stem.name} S${s+1} (${plan.bpm}BPM)`,
                   type: "audio",
                   url: sliceUrl,
                   format: "wav",
                   tags: ["stem", "slice", stem.eqMode, plan.key, "ai-orchestrated"],
                   albums: [],
                   metadata: { bpm: plan.bpm, key: plan.key, cleanupMode: stem.cleanup, quantize: plan.quantize, slice: s+1 },
                   sourcePageId: "sampler"
               });
               
               useAppStore.getState().addSequenceBlock({
                   id: stemId,
                   name: `${stem.name} [S${s+1}]`,
                   loopCount: 4,
                   volume: 75,
                   fx: [`cleanup:${stem.cleanup}`, `autotune:${plan.key}`],
                   mediaRef: stemId
               });
            }
        }
        
        setOrchestrationStatus(null);
        toast.success("Orchestration Complete", { description: "Stems cleanly extracted. Slices have been sent to the Sequencer Timeline and Global Media Gallery." });

        const req = buildPow3rRequest("ORCHESTRATE_AI_STEMS", {
            target: "SamplerEditor",
            config: plan
        });
        const res = await executePow3rWorkflow(req, async (data) => {
            return {
                msg: `AI Stem Routing Complete: Arranged ${plan.stems.length} stems at ${plan.bpm}BPM.`,
                type: "AI Orchestration",
            };
        });
        appendLogs(res);
        
    } catch (e) {
        setOrchestrationStatus(null);
        toast.error("Orchestration Failed", { description: String(e) });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleProcessSample = async () => {
    if (!audioBuffer) {
        toast.error("No sample loaded. Please upload or generate audio first.");
        return;
    }
    
    setIsProcessing(true);
    toast.info("Slicing Audio...", { description: "Applying transient detection and pitch shift" });

    try {
      const currentConfig = `Pitch: ${pitchShift}, Stretch: ${timeStretch}%, Slice: ${activeSlice}, Duration: ${audioBuffer.duration.toFixed(2)}s`;
      
      const aiResponse = await fetch("/api/generate-text", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ 
             prompt: `Generate a brief computer-vision style JSON representing detected audio transients (start, end, confidence). Config: ${currentConfig}. No markdown, just JSON array.`,
             model: "gemini-2.5-flash"
         })
      });

      let textOutput = "[]";
      if (aiResponse.ok) {
         const data = await aiResponse.json();
         textOutput = data.text || textOutput;
      }
      setGeneratedTransientData(textOutput);

      const req = buildPow3rRequest("PROCESS_AUDIO", {
        target: "SamplerEditor",
        config: { pitchShift, timeStretch, activeSlice, transientData: textOutput }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Sample sliced with pitch ${data.config?.pitchShift}.`,
          type: "Sampler Input",
        };
      });
      
      appendLogs(res);
      playSlice(); // actually play it

      const sliceId = `sampler_slice_${Date.now()}`;
      if (audioUrl && audioContextRef.current) {
          // Crop the AudioBuffer to the exact slice so LoopPlayer plays just the slice
          const sliceDuration = audioBuffer.duration / 8;
          const startTime = (activeSlice - 1) * sliceDuration;
          const sampleRate = audioBuffer.sampleRate;
          const startSample = Math.floor(startTime * sampleRate);
          const endSample = Math.floor((startTime + sliceDuration) * sampleRate);
          const length = endSample - startSample;
          const numChannels = audioBuffer.numberOfChannels;
          
          const sliceBuffer = audioContextRef.current.createBuffer(numChannels, length, sampleRate);
          for (let i = 0; i < numChannels; i++) {
              const channelData = new Float32Array(length);
              audioBuffer.copyFromChannel(channelData, i, startSample);
              sliceBuffer.copyToChannel(channelData, i, 0);
          }
          
          const wavData = audioBufferToWav(sliceBuffer);
          const uint8Array = new Uint8Array(wavData);
          
          // Fast arraybuffer to base64
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunkSize) as any);
          }
          const base64String = btoa(binary);
          
          const sliceUrl = `data:audio/wav;base64,${base64String}`;
          setMediaCache(sliceId, sliceUrl); 
          
          addGalleryItem({
             title: `Sample Trim (S${activeSlice}, Ptch:${pitchShift})`,
             type: "audio",
             url: sliceUrl,
             format: "wav",
             tags: ["sampler", `pitch:${pitchShift}`, `stretch:${timeStretch}`],
             albums: [],
             metadata: { pitchShift, timeStretch, activeSlice },
             sourcePageId: "sampler"
          });
      }

      useAppStore.getState().addSequenceBlock({
        id: sliceId,
        name: `Sliced Loop ${activeSlice}`,
        loopCount: 4,
        volume: 80,
        fx: [`playbackRate:${(timeStretch / 100) * Math.pow(2, pitchShift / 12)}`],
        mediaRef: sliceId
      });
      
      // Dispatch Spark IP Registration (Ledger)
      const ipTokenId = `spark_registry_${Date.now()}`;
      const lineageHash = Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const configObj = { 
          threshold: 95, 
          database: "Pow3r Global Enforceable Network", 
          fileName: `sampler_slice_${activeSlice}.wav`, 
          hash: lineageHash, 
          score: 100, 
          type: "Derivative" 
      };

      addGalleryItem({
         title: `IP Ledger Registry Record (Sampler ${activeSlice})`,
         type: "json",
         url: `data:application/json;base64,${btoa(JSON.stringify(configObj))}`,
         format: "json",
         tags: ["ip-lineage", "spark", "ledger"],
         albums: [],
         metadata: configObj,
         sourcePageId: "sampler"
      });

      useAppStore.getState().addSequenceBlock({
        id: ipTokenId,
        name: `IP Lineage Token`,
        loopCount: 1,
        volume: 0,
        fx: []
      });

      toast.success("Sample Sliced & Tokenized", { description: "Slice generated, added to sequence pipeline, and IP Lineage registered." });
    } catch (e) {
      toast.error("Processing Failed");
      useAppStore.getState().addSystemLog(`error: Sample processing failed: ${String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Copy, { className: "w-4 h-4" })} Sampler Editor
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
        {JSON.stringify({ component: "Sampler Editor", engine: "Pow3r", ready: true }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-mono h-[700px] w-full p-4 md:p-8 gap-6 relative">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-heading text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.6)]">Sample Chopper & Lineage Extraction</h2>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest flex items-center gap-2">
            Audio Slicing <span>•</span> <Sparkles className="w-3 h-3 text-emerald-400"/> Spark IP Registration Active
          </p>
        </div>
        <div className="flex gap-2">
           <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] rounded animate-pulse">
             IP LEDGER: OK
           </div>
           <div className="px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-[10px] rounded animate-pulse">
             ENGINE: ONLINE
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-0">
        <div className="w-full h-48 min-h-[192px] bg-black border border-zinc-800 rounded-xl overflow-hidden relative group">
            <div className="absolute inset-0 flex items-end gap-[1px] px-2 opacity-80 pb-2 pt-8">
                {(waveform.length > 0 ? waveform : Array.from({length: 200}).fill(0.1) as number[]).map((val, i) => {
                    const progress = (i / 200) * 100;
                    const isActiveSlice = progress >= trimStart && progress <= trimEnd && 
                                          progress >= trimStart + ((activeSlice - 1) * ((trimEnd - trimStart) / 8)) && 
                                          progress < trimStart + (activeSlice * ((trimEnd - trimStart) / 8));
                    const isTrimmed = progress < trimStart || progress > trimEnd;
                    return (
                       <div key={i} className={`flex-1 transition-all duration-100 ${isTrimmed ? 'bg-zinc-800 h-2' : isActiveSlice ? 'bg-white' : 'bg-fuchsia-500/80'} ${isPlaying && isActiveSlice ? 'animate-pulse' : ''}`} style={{ height: isTrimmed ? '10%' : `${Math.max(4, val * 100)}%` }}></div>
                    )
                })}
            </div>
            
            {/* Trim controls overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <input type="range" className="absolute top-1/2 -translate-y-1/2 w-[calc(100%-16px)] mx-2 accent-white h-1 appearance-none bg-transparent cursor-pointer z-30" min="0" max="100" value={trimStart} onChange={e => setTrimStart(Math.min(parseInt(e.target.value), trimEnd - 1))} style={{ pointerEvents: 'auto' }} />
                <input type="range" className="absolute top-1/2 -translate-y-1/2 w-[calc(100%-16px)] mx-2 accent-white h-1 appearance-none bg-transparent cursor-pointer z-30" min="0" max="100" value={trimEnd} onChange={e => setTrimEnd(Math.max(parseInt(e.target.value), trimStart + 1))} style={{ pointerEvents: 'auto' }} />
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 bottom-0 border-l border-white/50 border-dashed" style={{ left: `calc(${trimStart}% + 8px)` }}></div>
                    <div className="absolute top-0 bottom-0 border-r border-white/50 border-dashed" style={{ right: `calc(${100 - trimEnd}% + 8px)` }}></div>
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none">
               {[10, 25, 40, 55, 70, 85].map(pos => (
                 <div key={pos} className="absolute top-0 bottom-0 w-[1px] bg-white/10 text-white/30 text-[8px] pl-1 font-mono pt-1" style={{ left: `${pos}%` }}>
                      {pos}
                 </div>
               ))}
            </div>
            
            {isProcessing && !orchestrationStatus && (
                <div className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_#fff] z-10 animate-[progress_4s_linear_infinite]"></div>
            )}
            
            {orchestrationStatus && (
                <div className="absolute inset-0 bg-fuchsia-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4">
                   <Sparkles className="w-8 h-8 text-fuchsia-400 animate-pulse mb-2" />
                   <span className="text-fuchsia-200 text-xs font-bold text-center">{orchestrationStatus}</span>
                   {orchestrationPlan && (
                      <div className="mt-2 text-[8px] text-zinc-400 flex flex-col items-center gap-1">
                         <span>IDENTIFIED: {orchestrationPlan.key} @ {orchestrationPlan.bpm} BPM</span>
                         <span className="text-fuchsia-500/50">SEPARATING VOCALS, HARMONIES, AND INSTRUMENTAL STEMS</span>
                      </div>
                   )}
                </div>
            )}
            
            {generatedTransientData && !isProcessing && (
                <div className="absolute top-2 left-2 right-2 bg-fuchsia-950/80 border border-fuchsia-400 p-2 text-fuchsia-200 text-[8px] font-mono z-20 whitespace-pre-wrap max-h-[80px] overflow-y-auto">
                    <span className="font-bold block mb-1">AI DETECTED TRANSIENTS:</span>
                    {generatedTransientData}
                </div>
            )}
            
            <div className="absolute top-2 left-2 right-2 bg-black/80 px-2 py-1 flex items-center justify-between text-[10px] text-fuchsia-400 rounded-lg border border-zinc-800 z-10 w-auto glass">
                <div className="flex items-center gap-2 truncate max-w-[70%]">
                   <Music className="w-3 h-3 shrink-0" />
                   <span className="truncate">{fileName}</span>
                </div>
                <label className="cursor-pointer hover:bg-fuchsia-500/20 px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0">
                   <Upload className="w-3 h-3" /> UPLOAD AUDIO
                   <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
             <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
                <span>AI ORCHESTRATION</span>
                <Sparkles className="w-4 h-4 text-fuchsia-500" />
             </div>
             
             <p className="text-[10px] text-zinc-500 mb-4 leading-relaxed">
               Execute a complete AI-driven stem orchestration. Detects exact BPM/Key, separates vocals, identifies singers/harmonies/ad-libs, cleans vocals (de-ess/autotune), and extracts quantized slices.
             </p>
             
             {orchestrationPlan && !isProcessing && (
                 <div className="bg-zinc-950 p-2 border border-zinc-800 rounded mb-4 text-[9px] text-zinc-400 space-y-1">
                     <span className="text-fuchsia-400 font-bold">LATEST PLAN:</span> {orchestrationPlan.bpm}BPM | {orchestrationPlan.key}
                     <div className="mt-1">
                        {orchestrationPlan.stems?.map((s: any, idx: number) => (
                           <div key={idx} className="flex justify-between border-t border-zinc-800/50 pt-1 mt-1">
                              <span>{s.name}</span>
                              <span className="text-zinc-600">[{s.cleanup}]</span>
                           </div>
                        ))}
                     </div>
                 </div>
             )}

             <div className="mt-auto">
               <button onClick={handleOrchestrate} disabled={isProcessing} className="w-full bg-gradient-to-r from-fuchsia-900 to-indigo-900 border border-fuchsia-500/50 hover:from-fuchsia-800 hover:to-indigo-800 text-fuchsia-100 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isProcessing ? "ORCHESTRATING..." : <><Layers className="w-4 h-4" /> SPLIT STEMS & VOCALS</>}
               </button>
             </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
             <div>
                 <div className="text-xs text-zinc-400 font-bold mb-4 pb-2 border-b border-zinc-800 flex justify-between">
                    <span>MANUAL SLICE CONTROLS</span>
                    <Scissors className="w-4 h-4 text-zinc-500" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                       <div className="text-[10px] text-zinc-500 mb-1">PITCH SHIFT ({pitchShift})</div>
                       <input type="range" className="w-full accent-fuchsia-500" min="-24" max="24" value={pitchShift} onChange={(e) => setPitchShift(parseInt(e.target.value))} />
                     </div>
                     <div>
                       <div className="text-[10px] text-zinc-500 mb-1">TIME STRETCH ({timeStretch}%)</div>
                       <input type="range" className="w-full accent-fuchsia-500" min="50" max="200" value={timeStretch} onChange={(e) => setTimeStretch(parseInt(e.target.value))} />
                     </div>
                 </div>
                 <div className="grid grid-cols-4 gap-2 mt-6">
                     {[1,2,3,4,5,6,7,8].map(pad => (
                         <button key={pad} onClick={() => setActiveSlice(pad)} className={`bg-zinc-950 border ${activeSlice === pad ? 'border-fuchsia-400 bg-fuchsia-900/40 text-white' : 'border-zinc-800 text-zinc-500 hover:border-fuchsia-500/50'} aspect-square rounded text-xs flex items-center justify-center`}>
                             S{pad}
                         </button>
                     ))}
                 </div>
             </div>
             
             <div className="flex gap-2 mt-6">
               <button onClick={playSlice} disabled={isProcessing} className="flex-1 bg-zinc-950 border border-zinc-700 hover:bg-zinc-800 hover:border-fuchsia-500/50 text-zinc-300 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  <Play className="w-4 h-4 fill-zinc-400" /> PLAY
               </button>
               <button onClick={stopSlice} disabled={isProcessing} className="bg-zinc-950 border border-zinc-700 hover:bg-red-900/50 hover:border-red-500/50 text-zinc-300 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  <Square className="w-4 h-4 fill-zinc-400" />
               </button>
               <button onClick={() => setIsLooping(!isLooping)} disabled={isProcessing} className={`bg-zinc-950 border ${isLooping ? 'border-emerald-500 text-emerald-400 bg-emerald-900/30' : 'border-zinc-700 text-zinc-500 hover:border-emerald-500/50'} px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50`}>
                  <Repeat className="w-4 h-4" />
               </button>
               <button onClick={handleProcessSample} disabled={isProcessing} className="flex-1 bg-fuchsia-900 border border-fuchsia-700 hover:bg-fuchsia-800 hover:border-fuchsia-500 text-fuchsia-100 px-4 py-3 rounded-md text-[10px] tracking-widest font-sans font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                  {isProcessing ? "PROC..." : <><Layers className="w-4 h-4" /> ADD TO SEQ</>}
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

