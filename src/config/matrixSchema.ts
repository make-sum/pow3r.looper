export interface HorizontalPanelDef {
  title: string;
  type:
    | "gallery"
    | "presets"
    | "settings"
    | "history"
    | "controls"
    | "editor"
    | "canvas"
    | "misc"
    | "main";
  subtitle?: string;
  controlsId?: string; // Links back to MAIN_PAGES_SCHEMA control definitions if needed
}

export interface GridRowDef {
  id: string; // e.g. "music", "video", "loop_player"
  title: string;
  category: "track" | "loop" | "app" | "node"; // Track vs Loop View
  panels: Record<number, HorizontalPanelDef>;
}

export const MATRIX_SCHEMA: Record<number, GridRowDef> = {
  // --- TRACKS ---
  [-6]: {
    id: "xmap_json",
    title: "XMAP JSON Editor",
    category: "loop",
    panels: {
      0: { title: "WYSWYG Editor & Controls", type: "editor" },
      1: { title: "XMAP Revision History", type: "history" },
      [-1]: { title: "XMAP Gallery", type: "gallery" },
    },
  },
  [-5]: {
    id: "xmap_canvas",
    title: "XMAP Master Canvas",
    category: "loop",
    panels: {
      0: { title: "XMAP Diagram", type: "canvas" },
      1: { title: "XMAP Presets", type: "presets" },
      2: { title: "Orchestrator Presets", type: "presets" },
      [-1]: { title: "XMAP Settings", type: "settings" },
      [-2]: { title: "Search Workflow in Cloudflare", type: "misc" },
      [-3]: { title: "Slider Settings", type: "settings" },
    },
  },
  [-4]: {
    id: "sampler",
    title: "Sampler Slicer",
    category: "loop",
    panels: {
      0: { title: "Loop Editing", type: "controls" },
      1: { title: "Slicer Presets", type: "presets" },
      2: { title: "Transform Presets (BPM, Key)", type: "presets" },
      [-1]: { title: "Import & Library", type: "misc" },
      [-2]: { title: "Loop Settings", type: "settings" },
    },
  },
  [-3]: {
    id: "mixer",
    title: "Audio Mixer",
    category: "loop",
    panels: {
      0: { title: "Mixer Console", type: "controls" },
      1: { title: "Bus Effects", type: "presets" },
      [-1]: { title: "Mix Routing", type: "settings" },
    },
  },
  [-2]: {
    id: "sequencer",
    title: "Story Sequencer",
    category: "loop",
    panels: {
      0: { title: "Story Sequencer Timeline", type: "controls" },
      1: {
        title: "Sequencer Presets",
        type: "presets",
        subtitle: "Song, Pitch, short, story",
      },
      2: { title: "Narrative Arc Presets", type: "gallery" },
      [-1]: { title: "Sequencer Stories Gallery", type: "gallery" },
      [-2]: { title: "Sequencer Length Settings", type: "settings" },
      [-3]: { title: "Import / Export", type: "misc" },
    },
  },
  [-1]: {
    id: "loop_player",
    title: "Loop Player",
    category: "loop",
    panels: {
      0: { title: "Loop Player", type: "controls" },
      1: { title: "Slider Gallery", type: "gallery" },
      [-1]: { title: "Slider Settings", type: "settings" },
    },
  },
  0: {
    id: "music",
    title: "Music Gen",
    category: "track",
    panels: {
      0: { title: "Music Tracks Visualizer", type: "controls" },
      1: { title: "Production & Track Presets", type: "presets" },
      2: { title: "Mix & Effects Presets", type: "presets" },
      [-1]: { title: "Music Gallery", type: "gallery" },
      [-2]: { title: "Music Settings", type: "settings" },
      [-3]: { title: "Revision History", type: "history" },
    },
  },
  1: {
    id: "voice",
    title: "Voice Narrator",
    category: "track",
    panels: {
      0: { title: "Voice Track Visualizer", type: "controls" },
      1: { title: "Fx Presets & Modifiers", type: "presets" },
      2: { title: "Voice Cloning & Shaping", type: "controls" },
      [-1]: { title: "Voice Gallery", type: "gallery" },
      [-2]: { title: "Voice Settings", type: "settings" },
      [-3]: { title: "Revision History", type: "history" },
    },
  },
  2: {
    id: "image",
    title: "Image Gen",
    category: "track",
    panels: {
      0: { title: "Image Canvas", type: "controls" },
      1: { title: "Visual Style Presets", type: "presets" },
      2: { title: "Scene & Character Presets", type: "presets" },
      [-1]: { title: "Image Gallery", type: "gallery" },
      [-2]: { title: "Image Settings", type: "settings" },
      [-3]: { title: "Revision History", type: "history" },
    },
  },
  3: {
    id: "video",
    title: "Video Gen",
    category: "track",
    panels: {
      0: { title: "Video Player", type: "controls" },
      1: { title: "Visual Style Presets", type: "presets" },
      2: { title: "Director / Editor Presets", type: "presets" },
      [-1]: { title: "Video Gallery", type: "gallery" },
      [-2]: { title: "Video Settings", type: "settings" },
      [-3]: { title: "Revision History", type: "history" },
    },
  },
  4: {
    id: "light",
    title: "Lighting Gen",
    category: "track",
    panels: {
      0: { title: "Lighting Tracks Visualizer", type: "controls" },
      1: { title: "Atmosphere & Mood Presets", type: "presets" },
      2: { title: "Patterns & Colors", type: "presets" },
      [-1]: { title: "Lighting Gallery", type: "gallery" },
      [-2]: { title: "Lighting Settings", type: "settings" },
      [-3]: { title: "Revision History", type: "history" },
    },
  },
  5: {
    id: "laser",
    title: "SFX (Lasers & Fog)",
    category: "track",
    panels: {
      0: { title: "SFX Track Visualizer", type: "controls" },
      1: { title: "Lazer JS/CSS Presets", type: "presets" },
      2: { title: "Fog JS/CSS Presets", type: "presets" },
      [-1]: { title: "SFX Gallery", type: "gallery" },
      [-2]: { title: "SFX Settings", type: "settings" },
      [-3]: { title: "Revision History", type: "history" },
    },
  },
  6: {
    id: "code",
    title: "Agent Generator",
    category: "track",
    panels: {
      0: { title: "Agent Visualizer", type: "controls" },
      1: { title: "Agent Knowledge Presets (Brains)", type: "presets" },
      2: { title: "Agent Visual Presets (Body)", type: "presets" },
      3: { title: "Voice Presets", type: "gallery" },
      4: { title: "Persona Presets", type: "presets" },
      [-1]: { title: "Agent Gallery", type: "gallery" },
      [-2]: { title: "Models", type: "settings" },
      [-3]: { title: "Tool Usage", type: "misc" },
      [-4]: { title: "Memory", type: "settings" },
      [-5]: { title: "Agent Revision History", type: "history" },
    },
  },
  7: {
    id: "dance",
    title: "Dance Choreography",
    category: "track",
    panels: {
      0: { title: "Dance Track Visualizer", type: "controls" },
      1: { title: "Dance Presets", type: "presets" },
      [-1]: { title: "Choreography Gallery", type: "gallery" },
      [-2]: { title: "Settings", type: "settings" },
    },
  },
  8: {
    id: "amca",
    title: "AMCA Visualizer",
    category: "track",
    panels: {
      0: { title: "Audio Meta Track Visualizer", type: "controls" },
      1: { title: "EssentiaJS Presets (Music)", type: "presets" },
      2: { title: "Google NLP Presets (Vocals)", type: "presets" },
      [-1]: { title: "AMCA Configuration", type: "settings" },
    },
  },
  9: {
    id: "vmca",
    title: "VMCA Visualizer",
    category: "track",
    panels: {
      0: { title: "Video Meta Track Visualizer", type: "controls" },
      1: { title: "Video Intelligence Presets", type: "presets" },
      [-1]: { title: "VMCA Configuration", type: "settings" },
    },
  },
  10: {
    id: "midi",
    title: "Midi Tracks",
    category: "track",
    panels: {
      0: { title: "MIDI Sequence Visualizer", type: "controls" },
      1: { title: "MIDI Output Presets", type: "presets" },
      [-1]: { title: "MIDI Settings", type: "settings" },
    },
  },
  11: {
    id: "spark_fingerprinting",
    title: "Spark Fingerprinting",
    category: "track",
    panels: {
      0: { title: "Spark & Pattern Detection", type: "controls" },
      1: { title: "Attribution Presets", type: "presets" },
      [-1]: { title: "Copyright Management & Defense", type: "settings" },
    },
  },
  12: {
    id: "projection_mapper",
    title: "3D Projection Mapper",
    category: "track",
    panels: {
      0: { title: "Projection Track Visualizer", type: "controls" },
      1: { title: "Mapping Presets", type: "presets" },
      [-1]: { title: "Display Output Settings", type: "settings" },
    },
  },
  13: {
    id: "hologram",
    title: "Hologram Track",
    category: "track",
    panels: {
      0: { title: "Hologram Sequence Configurator", type: "controls" },
      1: { title: "Hologram Presets", type: "presets" },
      [-1]: { title: "Hologram Projector Setup", type: "settings" },
    },
  },
  14: {
    id: "ar_presets",
    title: "AR / Lens Track",
    category: "track",
    panels: {
      0: { title: "AR Lens Track Visualizer", type: "controls" },
      1: { title: "Camera & AR Presets", type: "presets" },
      [-1]: { title: "AR Engine Settings", type: "settings" },
    },
  },
  15: {
    id: "mic_recorder",
    title: "Mic Input Recorder",
    category: "track",
    panels: {
      0: { title: "Record Editor", type: "controls" },
      1: { title: "Audio Effects", type: "presets" },
      [-1]: { title: "Audio Input Routing", type: "settings" },
    },
  },
  16: {
    id: "surface_scanner",
    title: "3D Surface Scanner",
    category: "track",
    panels: {
      0: { title: "Lidar / Surface Editor", type: "controls" },
      1: { title: "Scan Targets", type: "presets" },
      [-1]: { title: "Meshing Config", type: "settings" },
    },
  },
  17: {
    id: "video_tracking",
    title: "Motion Tracking Input",
    category: "track",
    panels: {
      0: { title: "Body & Face Kinematics editor", type: "controls" },
      1: { title: "Rigging Presets", type: "presets" },
      [-1]: { title: "Tracking Sensitivities", type: "settings" },
    },
  },
  18: {
    id: "wf_builder",
    title: "Workflow Builder",
    category: "track",
    panels: {
      0: { title: "Workflow Orchestrator", type: "controls" },
      1: { title: "MCP / API Definitions", type: "presets" },
      [-1]: { title: "Workflow Settings", type: "settings" },
    },
  },
  19: {
    id: "x_bugger",
    title: "X-Bugger",
    category: "track",
    panels: {
      0: { title: "Telemetry & Toast System", type: "controls" },
      1: { title: "Node Logs", type: "history" },
      [-1]: { title: "Config Settings", type: "settings" },
    },
  },
  20: {
    id: "x_messenger",
    title: "X-Messenger",
    category: "track",
    panels: {
      0: { title: "AI Expert System Chat", type: "controls" },
      1: { title: "Agent Presets", type: "presets" },
      [-1]: { title: "Messenger Settings", type: "settings" },
    },
  },
  21: {
    id: "component_factory",
    title: "Component Factory",
    category: "track",
    panels: {
      0: { title: "RaduxUI Generator", type: "controls" },
      1: { title: "Unbound Patterns", type: "presets" },
      [-1]: { title: "Factory Config", type: "settings" },
    },
  },
  22: {
    id: "data_router",
    title: "Data Router",
    category: "track",
    panels: {
      0: { title: "JSON Edge Transformer", type: "controls" },
      1: { title: "Logic Blocks", type: "presets" },
      [-1]: { title: "Routing Settings", type: "settings" },
    },
  },
  23: {
    id: "stage_builder",
    title: "3D Stage Builder",
    category: "track",
    panels: {
      0: { title: "R3F Configurator", type: "controls" },
      1: { title: "Particle Presets", type: "presets" },
      [-1]: { title: "WebGL Settings", type: "settings" },
    },
  },
  24: {
    id: "agent_sandbox",
    title: "Agent Sandbox",
    category: "track",
    panels: {
      0: { title: "Local LLM Shell", type: "controls" },
      1: { title: "Agent Presets", type: "presets" },
      [-1]: { title: "Sandbox Settings", type: "settings" },
    },
  },
  25: {
    id: "kinetix_gen",
    title: "Kinetix Gen",
    category: "track",
    panels: {
      0: { title: "Kinetix Engine", type: "controls" },
      1: { title: "Animation Presets", type: "presets" },
    },
  },
  26: {
    id: "agent_architect",
    title: "Agent Architect",
    category: "app",
    panels: {
      0: { title: "Architect Engine", type: "controls" },
      1: { title: "Swarm Config", type: "presets" },
    },
  }
};
