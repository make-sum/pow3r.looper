import { proxyGenerateText } from "../services/geminiService";
import React, { useState, useEffect, useRef } from "react";
import { Music, Play, AlertTriangle, Layers, SlidersHorizontal, Settings2, Dices, ChevronDown, ChevronRight, X } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { useAppStore } from "../store/appStore";
import { executePow3rWorkflow, buildPow3rRequest } from "../services/unifiedSchema";
import { toast } from "sonner";
import { ThreeVisualizer } from './visualizers/ThreeVisualizer';
import { useGalleryStore } from "../services/galleryService";

const GENRES = [
  "House", "Deep House", "Tech House", "Tropical House", "Future House", "Progressive House", "Electro House",
  "Techno", "Minimal Techno", "Dub Techno", "Acid Techno", "Industrial Techno", "Melodic Techno", "Hard Techno",
  "Trance", "Psytrance", "Uplifting Trance", "Vocal Trance", "Goa Trance",
  "Drum & Bass", "Liquid D&B", "Neurofunk", "Jump Up", "Jungle",
  "Dubstep", "Melodic Dubstep", "Brostep", "Riddim", "Deathstep",
  "Hardstyle", "Hardcore", "Frenchcore", "Happy Hardcore",
  "Ambient", "Dark Ambient", "Drone", "Psybient",
  "Synthwave", "Vaporwave", "Chillwave", "Cyberpunk", "Retrowave",
  "Cinematic", "Orchestral", "Trailer Music", "Epic Score",
  "Lo-Fi Hip Hop", "Trap", "Future Bass", "Wave", "Phonk",
  "Garage", "UK Garage", "2-Step", "Future Garage",
  "Breakbeat", "Nu Breaks", "Glitch Hop", "IDM", "Downtempo", "Psydub",
  "Pop", "Synthpop", "Electropop", "Indie Pop",
  "Rock", "Industrial Rock", "Electronic Rock"
];
const INSTRUMENTS = ["Analog Synths", "808 Bass", "Acoustic Guitar", "Orchestral Strings", "Distorted Electric Guitar", "Grand Piano"];
const MIX_TERMS = ["Sidechain Pumping", "Tape Saturation", "Analog Warmth", "Brickwall Limited", "Lo-Cut at 30Hz", "Aggressive Compression", "Vintage EQ"];
const SPATIAL = ["Wide Stereo", "Binaural Panning", "Dolby Atmos", "3D Surround", "Center Focused"];
const EFFECTS = ["Huge Hall Reverb", "Ping-Pong Delay", "Chorus", "Flanger", "Bitcrusher", "Overdrive"];
const VOCALS = ["Auto-Tuned", "Vocoder", "Whispered", "Choir Backing", "Dry & Intimate", "Reverb-Drenched"];
const SONG_STRUCTURE = ["[Verse]", "[Chorus]", "[Bridge]", "[Drop]", "[Build]", "[Intro]", "[Outro]", "[Pre-Chorus]", "[Hook]"];

const ALL_STYLE_SUGGESTIONS = [...GENRES, ...INSTRUMENTS, ...MIX_TERMS, ...SPATIAL, ...EFFECTS];
const ALL_LYRICS_SUGGESTIONS = [...SONG_STRUCTURE, ...VOCALS.map(v => `[${v}]`)];

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true, extraHeader = null, className = "" }: any) => {
   const [isOpen, setIsOpen] = useState(defaultOpen);
   return (
       <div className={`bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col relative w-full ${className}`}>
           <div className="p-4 cursor-pointer flex justify-between items-center select-none" onClick={() => setIsOpen(!isOpen)}>
               <div className="text-[10px] text-zinc-400 font-mono font-bold flex items-center gap-2">
                   {Icon && <Icon className="w-3 h-3" />}
                   {title}
               </div>
               <div className="flex items-center gap-2">
                   {extraHeader && <div onClick={e => e.stopPropagation()}>{extraHeader}</div>}
                   {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
               </div>
           </div>
           {isOpen && (
               <div className="p-4 pt-0 flex-1 flex flex-col min-h-0">
                  {children}
               </div>
           )}
       </div>
   );
};

const AutoCompleteTextArea = ({ 
  value, 
  onChange, 
  placeholder, 
  textColor, 
  textShadow, 
  focusRingClass,
  suggestionsList
}: any) => {
  const [localVal, setLocalVal] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setLocalVal(value); }, [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localVal !== value) onChange(localVal);
    }, 400);
    return () => clearTimeout(t);
  }, [localVal, onChange, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
     const newVal = e.target.value;
     setLocalVal(newVal);

     const words = newVal.split(/[\s,]+/);
     const lastWord = words[words.length - 1];
     if (lastWord.length >= 2) {
         const match = suggestionsList.filter((s: string) => s.toLowerCase().includes(lastWord.toLowerCase()));
         setFilteredSuggestions(match.slice(0, 15));
         setShowSuggestions(match.length > 0);
     } else {
         setShowSuggestions(false);
     }
  };

  const insertSuggestion = (sug: string) => {
     const words = localVal.split(/[\s,]+/);
     words.pop();
     const newText = words.join(" ") + (words.length > 0 ? " " : "") + sug + ", ";
     setLocalVal(newText);
     onChange(newText);
     setShowSuggestions(false);
     textAreaRef.current?.focus();
  };

  const handleClear = () => {
      setLocalVal("");
      onChange("");
  };

  return (
    <div className="relative flex flex-col flex-1 h-full min-h-[150px]">
       <button onClick={handleClear} className="absolute right-2 top-2 p-1 bg-black/40 hover:bg-red-900/60 text-zinc-400 hover:text-red-400 rounded z-10 transition-colors" title="Clear all">
           <X className="w-3 h-3" />
       </button>
       <textarea 
         ref={textAreaRef}
         className={`w-full flex-1 bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-4 font-mono text-xs focus:outline-none resize-none shadow-inner custom-scrollbar ${focusRingClass}`}
         style={{ color: textColor, textShadow }}
         placeholder={placeholder}
         value={localVal}
         onChange={handleInputChange}
         onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
         onFocus={handleInputChange as any}
       />
       {showSuggestions && (
          <div className="absolute top-full lg:bottom-4 lg:top-auto left-4 right-4 max-h-40 overflow-y-auto bg-zinc-900 border border-indigo-500/50 rounded shadow-2xl z-50 flex flex-wrap gap-1 p-2 custom-scrollbar">
              <div className="w-full text-[8px] text-zinc-500 font-bold mb-1 uppercase tracking-widest pl-1">Suggestions</div>
              {filteredSuggestions.map((s, i) => (
                 <button 
                   key={i} 
                   onClick={() => insertSuggestion(s)}
                   className="text-[10px] font-mono bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white px-2 py-1 rounded transition-colors"
                 >
                    {s}
                 </button>
              ))}
          </div>
       )}
    </div>
  );
};

export const MusicGen = ({ mode = "ui" }: { mode?: "ui" | "3d" | "flow" | "json"; }) => {
  const appendLogs = useAppStore(state => state.appendLogsFromPayload);
  const mediaCache = useAppStore((state) => state.mediaCache);
  const setMediaCache = useAppStore((state) => state.setMediaCache);
  const addGalleryItem = useGalleryStore(state => state.addItem);
  const [isProcessing, setIsProcessing] = useState(false);

  const [stylePrompt, setStylePrompt] = useState("Cyberpunk Dark Ambient sequence, 120 BPM, Tape Saturation, Industrial synth lead.");
  const [lyricsPrompt, setLyricsPrompt] = useState("");
  
  const [activeTab, setActiveTab] = useState<"Genre"|"Instruments"|"Engineering"|"Spatial"|"Effects"|"Vocals">("Genre");
  const [suggestionSearch, setSuggestionSearch] = useState("");

  const [bpm, setBpm] = useState(120);
  const [songSection, setSongSection] = useState("Song");
  const [duration, setDuration] = useState<number | "Auto">("Auto");
  const [complexity, setComplexity] = useState(80);
  
  const generatedAudio = mediaCache["musicGen"] || null;

  const appendToStyle = (txt: string) => {
      setStylePrompt(prev => {
          const sep = prev && !prev.endsWith(",") && !prev.endsWith(".") && prev.trim().length > 0 ? ", " : "";
          return prev + sep + txt;
      });
  };

  const appendToLyrics = (txt: string) => {
      setLyricsPrompt(prev => {
          const sep = prev && !prev.endsWith(",") && !prev.endsWith(".") && prev.trim().length > 0 ? ", " : "";
          return prev + sep + txt;
      });
  };

  const handleGenerate = async () => {
    setIsProcessing(true);
    toast.info("Generating Music Track...", { description: "Applying generative engine & DSP" });
    
    try {
      let parsedBpm = bpm;
      try {
          const paramsResponse = await proxyGenerateText(`Extract the BPM number from this prompt: "${stylePrompt}". Return ONLY the number. If none, return 120.`);
          const parsed = parseInt(paramsResponse.trim() || "120");
          if (!isNaN(parsed) && parsed > 50 && parsed < 300) {
             parsedBpm = parsed;
             setBpm(parsedBpm);
          }
      } catch (e) {
          // just ignore
      }

      // Call the backend endpoint for Gemini Music (Lyria)
      const targetDuration = duration === "Auto" ? "auto" : `${duration}s`;
      const mixPrompt = `BPM: ${parsedBpm}, Complexity: ${complexity}%, Section: ${songSection}, Loop seamlessly on beat. Style: ${stylePrompt}`;

      const response = await fetch("/api/generate-music", {
         method: "POST",
         headers: {
             "Content-Type": "application/json"
         },
         body: JSON.stringify({
             stylePrompt: mixPrompt,
             lyricsPrompt,
             duration: targetDuration
         })
      });

      if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Generation failed on API.");
      }

      const prediction = await response.json();
      
      let audioUrl = "";
      if (prediction.audioBase64) {
          audioUrl = `data:${prediction.mimeType || "audio/wav"};base64,${prediction.audioBase64}`;
      } else {
          throw new Error("No audio returned from model.");
      }

      const uniqueMediaRef = `musicGen_${Date.now()}`;
      setMediaCache(uniqueMediaRef, audioUrl);
      setMediaCache("musicGen", audioUrl); // For UI preview inside MusicGen

      const req = buildPow3rRequest("INFER_GENERATIVE_TRACK", {
        target: "MusicGen",
        prompt: `Style: ${stylePrompt} | Lyrics: ${lyricsPrompt}`,
        config: { bpm: parsedBpm, duration, complexity }
      });
      
      const res = await executePow3rWorkflow(req, async (data) => {
        return { 
          msg: `Track synthesis complete: ${data.config?.bpm} BPM`,
          type: "Audio Base",
          bpm: data.config?.bpm
        };
      });
      
      appendLogs(res);

      useAppStore.getState().addSequenceBlock({
        id: `music_gen_${Date.now()}`,
        name: `Lyria Track (${songSection}) ${parsedBpm}BPM`,
        loopCount: duration === "Auto" ? 4 : Math.ceil((duration / 4)), 
        volume: 85,
        fx: [],
        mediaRef: uniqueMediaRef,
        metadata: { bpm: parsedBpm, stylePrompt, lyricsPrompt, duration, complexity, songSection }
      });

      addGalleryItem({
        title: `Lyria Track (${songSection}) ${parsedBpm}BPM`,
        type: 'audio',
        url: audioUrl,
        format: 'WAV',
        length: Math.ceil(duration === "Auto" ? 10 : duration) + 's',
        tags: [songSection.toLowerCase(), ...stylePrompt.split(',').slice(0,3).map(k => k.trim().toLowerCase())],
        albums: ['global'],
        metadata: {
          prompt: mixPrompt,
          bpm: parsedBpm,
          complexity,
          lyrics: lyricsPrompt
        },
        sourcePageId: 'music-gen',
        sourcePanel: mode === 'flow' ? 'both' : 'left'
      });
      
      toast.success("Generation Successful", { description: "Audio added to sequence and Global Gallery." });
    } catch (e: any) {
      toast.error("Generation Failed", { description: e.message });
      useAppStore.getState().addSystemLog(`error: Music generation failed: ${e.message || String(e)}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (mode === "flow") {
    return (
      <div className="bg-[#0a0a0a] border-2 border-indigo-500 rounded-lg p-3 min-w-[250px] shadow-[0_0_15px_rgba(99,102,241,0.3)]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 border-2 border-zinc-900 bg-indigo-500" />
        <div className="font-mono font-bold text-xs text-indigo-400 uppercase tracking-wider mb-2 border-b border-zinc-800 pb-2 flex items-center gap-2">
          {React.createElement(Music, { className: "w-4 h-4" })} Music Gen
        </div>
        <div className="text-[10px] text-indigo-300">Generative Audio Synthesizer Node</div>
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
        {JSON.stringify({ component: "Music Gen", engine: "Procedural", prompt: `Style: ${stylePrompt} | Lyrics: ${lyricsPrompt}`, config: { bpm, duration } }, null, 2)}
      </pre>
    );
  }

  return (
    <div className="flex flex-col font-sans h-full w-full p-4 md:p-8 gap-4 relative overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold font-mono text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]">Procedural Music Engine</h2>
          <p className="text-xs text-zinc-500 mt-1 font-mono tracking-widest uppercase">Multi-timbral Generative Synthesizer</p>
        </div>
        <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono rounded animate-pulse">
          ENGINE: ONLINE
        </div>
      </div>

      {/* TOP ROW: STYLE & LYRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0 w-full">
          <CollapsibleSection 
              title="STYLE & ARRANGEMENT" 
              icon={SlidersHorizontal} 
              defaultOpen={true}
              extraHeader={(
                  <button onClick={() => setStylePrompt(`A booming ${bpm} BPM 80s techno track with heavy saturation.`)} className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                      <Dices className="w-3 h-3" /> RANDOMIZER
                  </button>
              )}
          >
              <AutoCompleteTextArea 
                  value={stylePrompt}
                  onChange={setStylePrompt}
                  placeholder="Describe the arrangement... e.g. A heavy cyberpunk bassline at 120bpm with distorted synths."
                  textColor="#a5b4fc"
                  textShadow="0 0 10px rgba(165,180,252,0.2)"
                  focusRingClass="focus:border-indigo-500/50"
                  suggestionsList={ALL_STYLE_SUGGESTIONS}
              />
          </CollapsibleSection>

          <CollapsibleSection 
              title="LYRICS & VOCALS" 
              icon={Music} 
              defaultOpen={true}
              extraHeader={(
                  <button onClick={() => setLyricsPrompt(`[Verse 1]\nNeon lights in the rain...`)} className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                      <Dices className="w-3 h-3" /> DEMO
                  </button>
              )}
          >
              <AutoCompleteTextArea 
                  value={lyricsPrompt}
                  onChange={setLyricsPrompt}
                  placeholder="Enter lyrics here... use brackets for vocal directions like [Auto-Tuned] or [Chorus]"
                  textColor="#f9a8d4"
                  textShadow="0 0 10px rgba(249,168,212,0.2)"
                  focusRingClass="focus:border-pink-500/50"
                  suggestionsList={ALL_LYRICS_SUGGESTIONS}
              />
          </CollapsibleSection>
      </div>

      {/* SECOND ROW: PARAMS, MATRIX, AND AUDIO DSP */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
         {/* Left Col - Prompt Meta / Suggestions / Params */}
         <div className="lg:col-span-1 flex flex-col gap-4">
             <CollapsibleSection title="SUGGESTION MATRIX" icon={Settings2} defaultOpen={false} className="flex-shrink-0">
                 <div className="flex flex-col gap-2 h-[250px]">
                    <div className="flex flex-col gap-2 shrink-0">
                       <div className="flex flex-wrap gap-1">
                           {["Genre", "Instruments", "Engineering", "Spatial", "Effects", "Vocals"].map(tab => (
                               <button
                                  key={tab}
                                  onClick={() => setActiveTab(tab as any)}
                                  className={`text-[8px] px-2 py-1 rounded font-bold transition-colors ${activeTab === tab ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}
                               >
                                   {tab.toUpperCase()}
                               </button>
                           ))}
                       </div>
                       <input 
                         type="text" 
                         placeholder={`Search ${activeTab.toLowerCase()}...`}
                         value={suggestionSearch}
                         onChange={(e) => setSuggestionSearch(e.target.value)}
                         className="w-full bg-zinc-950/50 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                       />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
                       {activeTab === "Genre" && GENRES.filter(t => t.toLowerCase().includes(suggestionSearch.toLowerCase())).map(t => <button key={t} onClick={() => appendToStyle(t)} className="w-full text-left text-[9px] p-2 bg-zinc-950 border border-zinc-800 rounded text-indigo-300 hover:bg-indigo-900/30 hover:border-indigo-500/50 transition-colors truncate">{t}</button>)}
                       {activeTab === "Instruments" && INSTRUMENTS.filter(t => t.toLowerCase().includes(suggestionSearch.toLowerCase())).map(t => <button key={t} onClick={() => appendToStyle(t)} className="w-full text-left text-[9px] p-2 bg-zinc-950 border border-zinc-800 rounded text-indigo-300 hover:bg-indigo-900/30 hover:border-indigo-500/50 transition-colors truncate">{t}</button>)}
                       {activeTab === "Engineering" && MIX_TERMS.filter(t => t.toLowerCase().includes(suggestionSearch.toLowerCase())).map(t => <button key={t} onClick={() => appendToStyle(t)} className="w-full text-left text-[9px] p-2 bg-zinc-950 border border-zinc-800 rounded text-indigo-300 hover:bg-indigo-900/30 hover:border-indigo-500/50 transition-colors truncate">{t}</button>)}
                       {activeTab === "Spatial" && SPATIAL.filter(t => t.toLowerCase().includes(suggestionSearch.toLowerCase())).map(t => <button key={t} onClick={() => appendToStyle(t)} className="w-full text-left text-[9px] p-2 bg-zinc-950 border border-zinc-800 rounded text-indigo-300 hover:bg-indigo-900/30 hover:border-indigo-500/50 transition-colors truncate">{t}</button>)}
                       {activeTab === "Effects" && EFFECTS.filter(t => t.toLowerCase().includes(suggestionSearch.toLowerCase())).map(t => <button key={t} onClick={() => appendToStyle(t)} className="w-full text-left text-[9px] p-2 bg-zinc-950 border border-zinc-800 rounded text-indigo-300 hover:bg-indigo-900/30 hover:border-indigo-500/50 transition-colors truncate">{t}</button>)}
                       {activeTab === "Vocals" && VOCALS.filter(t => t.toLowerCase().includes(suggestionSearch.toLowerCase())).map(t => <button key={t} onClick={() => appendToLyrics(`[${t}]`)} className="w-full text-left text-[9px] p-2 bg-zinc-950 border border-zinc-800 rounded text-pink-300 hover:bg-pink-900/30 hover:border-pink-500/50 transition-colors truncate">{t}</button>)}
                    </div>
                 </div>
             </CollapsibleSection>

             <CollapsibleSection title="MIX & EFFECTS PRESETS" defaultOpen={true} className="flex-shrink-0">
                 <div className="flex flex-col gap-6">
                   <div className="space-y-4">
                       <div className="text-[10px] text-zinc-500 font-mono font-bold pb-1 border-b border-zinc-800">PARAMETERS</div>
                       <div>
                         <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2">
                           <span>TEMPO (BPM)</span>
                           <span className="text-indigo-400 font-bold">{bpm}</span>
                         </div>
                         <input type="range" className="w-full accent-indigo-500" min="60" max="200" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} />
                       </div>
                       
                       <div>
                         <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2">
                           <span>COMPLEXITY</span>
                           <span className="text-indigo-400 font-bold">{complexity}%</span>
                         </div>
                         <input type="range" className="w-full accent-indigo-500" min="0" max="100" value={complexity} onChange={e => setComplexity(parseInt(e.target.value))} />
                       </div>

                       <div>
                         <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2">
                           <span>SONG SECTION</span>
                           <span className="text-indigo-400 font-bold">{songSection.toUpperCase()}</span>
                         </div>
                         <select 
                             className="w-full bg-zinc-950 border border-zinc-700 text-indigo-300 rounded p-1 text-[10px] font-mono focus:outline-none"
                             value={songSection}
                             onChange={(e) => setSongSection(e.target.value)}
                         >
                             <option value="Intro">Intro</option>
                             <option value="Verse">Verse</option>
                             <option value="Part">Part (Verse fraction)</option>
                             <option value="Pre-Chorus">Pre-Chorus</option>
                             <option value="Chorus">Chorus</option>
                             <option value="Bridge">Bridge</option>
                             <option value="Build">Build</option>
                             <option value="Drop">Drop</option>
                             <option value="Breakdown">Breakdown</option>
                             <option value="Outro">Outro</option>
                             <option value="Remix">Remix</option>
                             <option value="Warp">Warp Transform</option>
                             <option value="Song">Full Song</option>
                             <option value="Custom">Custom Loop (Duration)</option>
                         </select>
                       </div>

                       {songSection === "Custom" && (
                         <div>
                           <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-2">
                             <span>DURATION</span>
                             <span className="text-indigo-400 font-bold">{duration}s</span>
                           </div>
                           <input type="range" className="w-full accent-indigo-500" min="5" max="60" value={duration === "Auto" ? 10 : duration} onChange={(e) => setDuration(parseInt(e.target.value))} />
                         </div>
                       )}
                   </div>

                   <div className="space-y-2">
                       <div className="text-[10px] text-zinc-500 font-mono font-bold pb-1 border-b border-zinc-800 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-500/50" /> STEMS
                       </div>
                       <div className="flex justify-around gap-2 items-end pt-2">
                           {[
                             { name: "KICK", max: 100 }, 
                             { name: "SNARE", max: 100 }, 
                             { name: "HI-HATS", max: 80 }, 
                             { name: "SUB BASS", max: 90 },
                             { name: "SYNTH", max: 85 }
                           ].map((stem, i) => (
                               <div key={stem.name} className="flex flex-col items-center gap-2 flex-1 max-w-[35px] hover:bg-zinc-800/30 pt-1 rounded transition-colors group">
                                   <input 
                                     type="range" 
                                     className="h-10 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-zinc-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 focus:outline-none" 
                                     style={{ writingMode: 'vertical-rl' }} 
                                     defaultValue={stem.max * (complexity / 100)}
                                     title={`Level: ${stem.max * (complexity / 100)}`}
                                   />
                                   <span className="text-[7px] font-mono text-zinc-500 group-hover:text-indigo-300 text-center tracking-tighter truncate w-full">{stem.name}</span>
                               </div>
                           ))}
                       </div>
                   </div>
                 </div>
             </CollapsibleSection>
         </div>

         {/* Right Col - Audio Output */}
         <div className="lg:col-span-3 flex flex-col">
             <CollapsibleSection title="AUDIO OUTPUT BUFFER & DSP" defaultOpen={true} className="h-full">
                 <div className="flex justify-between items-center z-10 mb-2 p-2 bg-black/40 rounded-lg border border-zinc-800/80 backdrop-blur-sm">
                   <div className="text-[10px] font-mono text-indigo-400 font-bold flex items-center gap-2 px-2">COMPILE & PREVIEW</div>
                   <div className="flex gap-4 items-center">
                     {generatedAudio && (
                       <audio id="music-gen-audio" crossOrigin="anonymous" src={generatedAudio} controls className="h-8 max-w-[200px] opacity-80 mix-blend-screen" loop />
                     )}
                     <button onClick={handleGenerate} disabled={isProcessing} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-xs font-sans font-bold flex items-center gap-2 transition-all disabled:opacity-50">
                        {isProcessing ? "PROCESSING DSP..." : <><Play className="w-4 h-4 fill-white" /> GENERATE AUDIO</>}
                     </button>
                   </div>
                 </div>
                 
                 <div className="flex-1 min-h-[250px] rounded-lg relative overflow-hidden flex flex-col border border-zinc-800 bg-[#050510] shadow-[inset_0_0_50px_rgba(0,0,0,1)] mt-2">
                     <div className="flex-1 relative flex items-center justify-center">
                         {isProcessing && (
                           <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-md">
                             <AlertTriangle className="w-10 h-10 text-indigo-500 animate-bounce drop-shadow-[0_0_15px_#6366f1]" />
                             <span className="text-xs font-mono text-indigo-400 animate-pulse tracking-widest mt-4">COMPILING ALGORITHMIC AUDIO...</span>
                           </div>
                         )}
                         <div className="absolute inset-0">
                             <ThreeVisualizer isActive={isProcessing || !!generatedAudio} />
                         </div>
                     </div>

                     {/* Advanced Mix Controls (RMS Only) */}
                     <div className="h-[90px] bg-black/80 backdrop-blur border-t border-indigo-900/30 p-2 flex gap-4 shrink-0 px-4 relative z-10 justify-end">
                         <div className="flex items-center justify-center pl-4 border-zinc-800">
                              <div className="flex flex-col items-center">
                                 <div className="text-[8px] text-zinc-500 font-mono mb-1">RMS</div>
                                 <div className="w-3 h-12 bg-zinc-900 rounded-sm relative overflow-hidden flex flex-col justify-end p-[1px]">
                                     <div className={`w-full transition-all duration-75 rounded-sm ${generatedAudio ? 'bg-gradient-to-t from-green-500 via-amber-400 to-red-500' : 'bg-transparent'}`} style={{ height: generatedAudio ? `${70 + Math.random() * 20}%` : '10%' }}></div>
                                 </div>
                              </div>
                         </div>
                     </div>
                 </div>
             </CollapsibleSection>
         </div>
      </div>
    </div>
  );
};


