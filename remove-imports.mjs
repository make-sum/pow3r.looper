import fs from "fs";

let content = fs.readFileSync("src/components/SurfaceView.tsx", "utf8");

const importsToRemove = [
  "WFBuilder", "ComponentFactory", "DataRouter", "StageBuilder", "AgentSandbox",
  "MusicGen", "VoiceGen", "Mixer", "Sequencer", "LoopPlayer", "ImageGen", "VideoGen", "LightGen", "SfxGen", "AgentGen",
  "SamplerEditor", "DanceGen", "Amca", "Vmca", "Midi", "SparkFingerprinting", "ProjectionMapper", "Hologram",
  "ArPresets", "MicRecorder", "SurfaceScanner", "VideoTracking"
];

for (const imp of importsToRemove) {
  const regex = new RegExp(`import \\{ ${imp} \\} from "[^"]+";\\n?`, "g");
  content = content.replace(regex, "");
}

fs.writeFileSync("src/components/SurfaceView.tsx", content, "utf8");
console.log("Successfully removed unused imports.");
