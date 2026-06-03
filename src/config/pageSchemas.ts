export interface MCPControlDefinition {
  id: string;
  type: "slider" | "switch" | "select" | "button";
  label: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
  options?: string[];
  mcpAction: string; // The MCP action to trigger when changed
}

export interface PageSchemaConfig {
  id: string;
  title: string;
  panels: {
    left: {
      title: string;
      controls: MCPControlDefinition[];
    };
    right: {
      title: string;
      controls: MCPControlDefinition[];
    };
  };
}

export const MAIN_PAGES_SCHEMA: PageSchemaConfig[] = [
  {
    id: "music",
    title: "Music Gen",
    panels: {
      left: {
        title: "Production & Track Logic",
        controls: [
          {
            id: "bpm",
            type: "slider",
            label: "BPM / Tempo",
            min: 60,
            max: 200,
            step: 1,
            defaultValue: 120,
            mcpAction: "SYNC_TEMPO",
          },
          {
            id: "genre",
            type: "select",
            label: "Primary Genre",
            options: ["Cyberpunk", "Synthwave", "Orchestral", "Hip Hop"],
            defaultValue: "Cyberpunk",
            mcpAction: "UPDATE_GENRE_SEED",
          },
        ],
      },
      right: {
        title: "Mix & Effects",
        controls: [
          {
            id: "reverb",
            type: "slider",
            label: "Hall Reverb Level",
            min: 0,
            max: 100,
            defaultValue: 20,
            mcpAction: "SET_EFFECT_REVERB",
          },
          {
            id: "compressor",
            type: "switch",
            label: "Master Bus Compressor",
            defaultValue: true,
            mcpAction: "TOGGLE_COMPRESSOR",
          },
        ],
      },
    },
  },
  {
    id: "video",
    title: "Video Gen",
    panels: {
      left: {
        title: "Visual Style Menu",
        controls: [
          {
            id: "style",
            type: "select",
            label: "Renderer Engine",
            options: ["Veo 8K", "Sora v2", "Runway Gen-3", "Pika Labs"],
            defaultValue: "Veo 8K",
            mcpAction: "SET_RENDER_ENGINE",
          },
          {
            id: "color_grading",
            type: "select",
            label: "Color Grading",
            options: [
              "Neon Noir",
              "Cinematic Teal/Orange",
              "Vintage Film",
              "Monochrome",
            ],
            defaultValue: "Neon Noir",
            mcpAction: "UPDATE_COLOR_GRADE",
          },
        ],
      },
      right: {
        title: "Director / Editor",
        controls: [
          {
            id: "camera_pan",
            type: "slider",
            label: "Camera Pan Speed",
            min: -50,
            max: 50,
            defaultValue: 10,
            mcpAction: "SET_CAMERA_PAN",
          },
          {
            id: "camera_zoom",
            type: "slider",
            label: "Dynamic Zoom",
            min: -50,
            max: 50,
            defaultValue: 5,
            mcpAction: "SET_CAMERA_ZOOM",
          },
        ],
      },
    },
  },
  {
    id: "voice",
    title: "Voice Narrator",
    panels: {
      left: {
        title: "Voice FX & Modulators",
        controls: [
          {
            id: "vocoder",
            type: "switch",
            label: "Vocoderize",
            defaultValue: false,
            mcpAction: "TOGGLE_VOCODER",
          },
          {
            id: "autotune",
            type: "slider",
            label: "T-Pain Auto-tune Amount",
            min: 0,
            max: 100,
            defaultValue: 80,
            mcpAction: "SET_AUTOTUNE_STRENGTH",
          },
          {
            id: "doubler",
            type: "switch",
            label: "Vocal Doubler",
            defaultValue: true,
            mcpAction: "TOGGLE_DOUBLER",
          },
        ],
      },
      right: {
        title: "Cloning & Shaping",
        controls: [
          {
            id: "pitch",
            type: "slider",
            label: "Formant Pitch Shift",
            min: -12,
            max: 12,
            step: 1,
            defaultValue: 0,
            mcpAction: "SET_FORMANT_PITCH",
          },
          {
            id: "voice_model",
            type: "select",
            label: "Base Clone Model",
            options: ["Grok Heavy", "ElevenLabs Turbo", "PlayHT v3"],
            defaultValue: "Grok Heavy",
            mcpAction: "SELECT_VOICE_MODEL",
          },
        ],
      },
    },
  },
  {
    id: "image",
    title: "Image Gen",
    panels: {
      left: {
        title: "Visual Settings",
        controls: [
          {
            id: "aspect_ratio",
            type: "select",
            label: "Aspect Ratio",
            options: ["16:9", "9:16", "1:1", "21:9"],
            defaultValue: "16:9",
            mcpAction: "SET_ASPECT_RATIO",
          },
          {
            id: "upscale",
            type: "switch",
            label: "Auto-Upscaler (4x)",
            defaultValue: true,
            mcpAction: "TOGGLE_UPSCALER",
          },
        ],
      },
      right: {
        title: "Scene & Character",
        controls: [
          {
            id: "chaos",
            type: "slider",
            label: "Chaos / Creativity",
            min: 0,
            max: 100,
            defaultValue: 40,
            mcpAction: "SET_CREATIVITY",
          },
          {
            id: "subject_distance",
            type: "slider",
            label: "Subject Distance",
            min: 0,
            max: 100,
            defaultValue: 50,
            mcpAction: "SET_SUBJECT_DISTANCE",
          },
        ],
      },
    },
  },
  {
    id: "light",
    title: "Lighting Gen",
    panels: {
      left: {
        title: "Atmosphere Check",
        controls: [
          {
            id: "global_illumination",
            type: "slider",
            label: "Global Illumination",
            min: 0,
            max: 100,
            defaultValue: 80,
            mcpAction: "SET_GI_LEVEL",
          },
          {
            id: "mood",
            type: "select",
            label: "Atmosphere Preset",
            options: [
              "Club Strobes",
              "Ambient Wash",
              "Cyberpunk Alley",
              "Pitch Black",
            ],
            defaultValue: "Club Strobes",
            mcpAction: "SET_LIGHTING_MOOD",
          },
        ],
      },
      right: {
        title: "Patterns & Color",
        controls: [
          {
            id: "primary_color",
            type: "select",
            label: "Primary Hue",
            options: ["Neon Pink", "Cyan", "Amber", "Emerald", "Purple"],
            defaultValue: "Cyan",
            mcpAction: "SET_PRIMARY_LIGHT",
          },
          {
            id: "strobe_speed",
            type: "slider",
            label: "Strobe Frequency",
            min: 0,
            max: 120,
            defaultValue: 0,
            mcpAction: "SET_STROBE_SPEED",
          },
        ],
      },
    },
  },
  {
    id: "laser",
    title: "Lasers & Fog",
    panels: {
      left: {
        title: "Lazer Engine CSS/JS",
        controls: [
          {
            id: "laser_count",
            type: "slider",
            label: "Active Lazer Emitters",
            min: 1,
            max: 64,
            step: 1,
            defaultValue: 16,
            mcpAction: "SET_LAZER_COUNT",
          },
          {
            id: "laser_chaos",
            type: "slider",
            label: "Beam Scatter (JS)",
            min: 0,
            max: 100,
            defaultValue: 25,
            mcpAction: "SET_LAZER_SCATTER",
          },
        ],
      },
      right: {
        title: "Fog Engine CSS/JS",
        controls: [
          {
            id: "fog_density",
            type: "slider",
            label: "Volumetric Fog Density",
            min: 0,
            max: 100,
            defaultValue: 60,
            mcpAction: "SET_FOG_DENSITY",
          },
          {
            id: "fog_velocity",
            type: "slider",
            label: "Fog Flow Speed",
            min: 0,
            max: 100,
            defaultValue: 15,
            mcpAction: "SET_FOG_FLOW",
          },
          {
            id: "fog_enable",
            type: "switch",
            label: "Enable Core Fog Loop",
            defaultValue: true,
            mcpAction: "TOGGLE_FOG_SYSTEM",
          },
        ],
      },
    },
  },
  {
    id: "code",
    title: "Code Gen",
    panels: {
      left: {
        title: "Avatar Config",
        controls: [
          {
            id: "avatar_model",
            type: "select",
            label: "Agent Persona",
            options: [
              "Lead Dev",
              "UX Designer",
              "Data Scientist",
              "Security Analyst",
            ],
            defaultValue: "Lead Dev",
            mcpAction: "SELECT_AVATAR_PERSONA",
          },
          {
            id: "auto_commit",
            type: "switch",
            label: "Auto Commit Agent Code",
            defaultValue: false,
            mcpAction: "TOGGLE_AGENT_AUTOCOMMIT",
          },
        ],
      },
      right: {
        title: "3D World Setting",
        controls: [
          {
            id: "gravity",
            type: "slider",
            label: "World Gravity",
            min: -20,
            max: 20,
            defaultValue: -9.8,
            step: 0.1,
            mcpAction: "SET_WORLD_GRAVITY",
          },
          {
            id: "wireframe",
            type: "switch",
            label: "Debug Wireframe Mode",
            defaultValue: false,
            mcpAction: "TOGGLE_3D_WIREFRAME",
          },
        ],
      },
    },
  },
  {
    id: "sampler",
    title: "Sampler Slicer",
    panels: {
      left: {
        title: "Loop Editing",
        controls: [
          {
            id: "slice_grid",
            type: "select",
            label: "Slice Grid Quantization",
            options: ["1/4", "1/8", "1/16", "1/32", "Free"],
            defaultValue: "1/16",
            mcpAction: "SET_SLICE_GRID",
          },
          {
            id: "transient_sens",
            type: "slider",
            label: "Transient Detection",
            min: 0,
            max: 100,
            defaultValue: 75,
            mcpAction: "SET_TRANSIENT_SENSITIVITY",
          },
        ],
      },
      right: {
        title: "Import & Library",
        controls: [
          {
            id: "auto_warp",
            type: "switch",
            label: "Auto-Warp to Origin BPM",
            defaultValue: true,
            mcpAction: "TOGGLE_AUTO_WARP",
          },
          {
            id: "pitch_match",
            type: "switch",
            label: "Enable Root Pitch Matching",
            defaultValue: true,
            mcpAction: "TOGGLE_PITCH_MATCH",
          },
        ],
      },
    },
  },
];
