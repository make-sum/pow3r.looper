import fs from "fs";

let content = fs.readFileSync("src/components/SurfaceView.tsx", "utf8");

// 1. First, find where XBugger is messed up.
const badXBuggerRegex = /\) : page\.id === "wf_builder" \? \([\s\S]*?\) : \(\s*mcpLogs\.map/g;
if (badXBuggerRegex.test(content)) {
  content = content.replace(badXBuggerRegex, ") : (\n            mcpLogs.map");
  console.log("Fixed XBugger part.");
} else {
  console.log("XBugger part already looks fine or not found.");
}

// 2. Second, find where we need to add the view components back.
const pageRenderRegex = /return page\.id === "xmap_canvas" \? \([\s\S]*?\) : \(/g;
  
const componentsToRender = `return page.id === "xmap_canvas" ? (
                                    <div className="absolute inset-0 z-30">
                                      <UnifiedCanvas />
                                    </div>
                                  ) : page.id === "xmap_json" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a] flex">
                                      <SchemaSidebar inline={true} />
                                    </div>
                                  ) : page.id === "x_bugger" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <XBugger mode="ui" logs={mcpLogs} />
                                    </div>
                                  ) : page.id === "x_messenger" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <XMessenger mode="ui" chat={expertChat} />
                                    </div>
                                  ) : page.id === "wf_builder" ? (
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

if (pageRenderRegex.test(content)) {
  content = content.replace(pageRenderRegex, componentsToRender);
  console.log("Fixed page render part.");
} else {
  console.log("Could not find the page render part to patch.", content.match(/return page\.id === "xmap_canvas"/));
}

fs.writeFileSync("src/components/SurfaceView.tsx", content, "utf8");
