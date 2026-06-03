import fs from "fs";

let content = fs.readFileSync("src/components/SurfaceView.tsx", "utf8");

// Re-add imports
const imports = `
import { WFBuilder } from "./WFBuilder";
import { ComponentFactory } from "./ComponentFactory";
import { DataRouter } from "./DataRouter";
import { StageBuilder } from "./StageBuilder";
import { AgentSandbox } from "./AgentSandbox";
import { MusicGen } from "./MusicGen";
import { VoiceGen } from "./VoiceGen";
import { Mixer } from "./Mixer";
import { Sequencer } from "./Sequencer";
import { LoopPlayer } from "./LoopPlayer";
import { ImageGen } from "./ImageGen";
import { VideoGen } from "./VideoGen";
import { LightGen } from "./LightGen";
import { SfxGen } from "./SfxGen";
import { AgentGen } from "./AgentGen";
import { SamplerEditor } from "./SamplerEditor";
import { DanceGen } from "./DanceGen";
import { Amca } from "./Amca";
import { Vmca } from "./Vmca";
import { Midi } from "./Midi";
import { SparkFingerprinting } from "./SparkFingerprinting";
import { ProjectionMapper } from "./ProjectionMapper";
import { Hologram } from "./Hologram";
import { ArPresets } from "./ArPresets";
import { MicRecorder } from "./MicRecorder";
import { SurfaceScanner } from "./SurfaceScanner";
import { VideoTracking } from "./VideoTracking";
`;

content = content.replace('import { XMessenger } from "./XMessenger";', 'import { XMessenger } from "./XMessenger";\n' + imports);

// Add the components back into the condition
const renderString = `) : page.id === "wf_builder" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <WFBuilder mode="ui" />
                                    </div>
                                  ) : page.id === "component_factory" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <ComponentFactory mode="ui" />
                                    </div>
                                  ) : page.id === "data_router" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <DataRouter mode="ui" />
                                    </div>
                                  ) : page.id === "stage_builder" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <StageBuilder mode="ui" />
                                    </div>
                                  ) : page.id === "agent_sandbox" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <AgentSandbox mode="ui" />
                                    </div>
                                  ) : page.id === "music" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <MusicGen mode="ui" />
                                    </div>
                                  ) : page.id === "voice" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <VoiceGen mode="ui" />
                                    </div>
                                  ) : page.id === "mixer" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <Mixer mode="ui" />
                                    </div>
                                  ) : page.id === "sequencer" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <Sequencer mode="ui" />
                                    </div>
                                  ) : page.id === "loop_player" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <LoopPlayer mode="ui" />
                                    </div>
                                  ) : page.id === "image" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <ImageGen mode="ui" />
                                    </div>
                                  ) : page.id === "video" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <VideoGen mode="ui" />
                                    </div>
                                  ) : page.id === "light" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <LightGen mode="ui" />
                                    </div>
                                  ) : page.id === "laser" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <SfxGen mode="ui" />
                                    </div>
                                  ) : page.id === "code" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <AgentGen mode="ui" />
                                    </div>
                                  ) : page.id === "sampler" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <SamplerEditor mode="ui" />
                                    </div>
                                  ) : page.id === "dance" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <DanceGen mode="ui" />
                                    </div>
                                  ) : page.id === "amca" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <Amca mode="ui" />
                                    </div>
                                  ) : page.id === "vmca" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <Vmca mode="ui" />
                                    </div>
                                  ) : page.id === "midi" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <Midi mode="ui" />
                                    </div>
                                  ) : page.id === "spark_fingerprinting" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <SparkFingerprinting mode="ui" />
                                    </div>
                                  ) : page.id === "projection_mapper" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <ProjectionMapper mode="ui" />
                                    </div>
                                  ) : page.id === "hologram" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <Hologram mode="ui" />
                                    </div>
                                  ) : page.id === "ar_presets" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <ArPresets mode="ui" />
                                    </div>
                                  ) : page.id === "mic_recorder" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <MicRecorder mode="ui" />
                                    </div>
                                  ) : page.id === "surface_scanner" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <SurfaceScanner mode="ui" />
                                    </div>
                                  ) : page.id === "video_tracking" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <VideoTracking mode="ui" />
                                    </div>
                                  ) : (`;

content = content.replace(') : (', renderString);

fs.writeFileSync("src/components/SurfaceView.tsx", content, "utf8");
console.log("Successfully restored tracks / components.");
