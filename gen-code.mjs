import fs from "fs";

const components = [
  { id: "music", file: "MusicGen" },
  { id: "voice", file: "VoiceGen" },
  { id: "mixer", file: "Mixer" },
  { id: "sequencer", file: "Sequencer" },
  { id: "loop_player", file: "LoopPlayer" },
  { id: "image", file: "ImageGen" },
  { id: "video", file: "VideoGen" },
  { id: "light", file: "LightGen" },
  { id: "laser", file: "SfxGen" },
  { id: "code", file: "AgentGen" },
  { id: "sampler", file: "SamplerEditor" },
  { id: "dance", file: "DanceGen" },
  { id: "amca", file: "Amca" },
  { id: "vmca", file: "Vmca" },
  { id: "midi", file: "Midi" },
  { id: "spark_fingerprinting", file: "SparkFingerprinting" },
  { id: "projection_mapper", file: "ProjectionMapper" },
  { id: "hologram", file: "Hologram" },
  { id: "ar_presets", file: "ArPresets" },
  { id: "mic_recorder", file: "MicRecorder" },
  { id: "surface_scanner", file: "SurfaceScanner" },
  { id: "video_tracking", file: "VideoTracking" }
];

let imports = components.map(c => `import { ${c.file} } from "./${c.file}";`).join("\n");
let conditions = components.map(c => `                                  ) : page.id === "${c.id}" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <${c.file} mode="ui" />
                                    </div>`).join("\n");

fs.writeFileSync("output.txt", imports + "\n\n" + conditions);
