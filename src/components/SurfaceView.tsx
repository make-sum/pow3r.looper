import {
  Play,
  Square,
  Volume2,
  Mic,
  Settings,
  Search,
  Loader2,
  Workflow,
  Fingerprint,
  Music,
  Import,
  Move,
  Send,
  Layers,
  Copy,
  Plus,
  FileDown,
  Download,
  Cloud,
  BrainCircuit,
  WifiOff,
  ShieldCheck,
  Activity,
  Box,
  Database,
  Image as ImageIcon,
  SlidersHorizontal,
  MapPin,
  Video,
  Lightbulb,
  CloudFog,
  Code,
  Code2,
  MessageSquare,
  Shield,
  Monitor,
  Ghost,
  ScanLine,
  User,
  Piano,
  Radar,
  Camera,
  Network,
  Layout,
  Brain,
  Cuboid,
  Users,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "motion/react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  generateAudio,
  deployToCloudflareWorkflows,
  runGuardianAudit,
  syncObsidianVault,
  formatWorkflowToWebTT,
} from "../services/platformServices";
import {
  askExpertAgent,
  enhancePrompt,
  generateImageFromPrompt,
  generateVideoFromPrompt,
  generateLyrics,
  buildDesignKnowledgeGraph,
} from "../services/geminiService";
import { AbacusWebSocketProxy } from "../services/abacusWebSocketService";
import { VaultGraph3D } from "./VaultGraph3D";
import { useAppStore } from "../store/appStore";
import {
  buildPow3rRequest,
  executePow3rWorkflow,
} from "../services/unifiedSchema";
import { toast } from "sonner";
import { MAIN_PAGES_SCHEMA } from "../config/pageSchemas";
import { DynamicPanelRenderer } from "./panels/DynamicPanelRenderer";
import Pow3rControl from "./Pow3rControl";
import GalleryBucket from "./GalleryBucket";
import { edgeAgent } from "../services/edgeAgent";

import { MATRIX_SCHEMA } from "../config/matrixSchema";
import UnifiedCanvas from "./UnifiedCanvas";
import SchemaSidebar from "./SchemaSidebar";
import { useWorkflowStore } from "../store/useWorkflowStore";

import { XBugger } from "./XBugger";
import { XMessenger } from "./XMessenger";

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
import { KinetixGen } from "./KinetixGen";
import { AgentArchitect } from "./AgentArchitect";
import { PipPlayer } from "./PipPlayer";

export default function SurfaceView() {
  const currentVerticalIndex = useAppStore(
    (state) => state.currentVerticalIndex,
  );
  const currentHorizontalIndex = useAppStore(
    (state) => state.currentHorizontalIndex,
  );
  const verticalDirection = useAppStore((state) => state.verticalDirection);
  const sequenceBlocks = useAppStore((state) => state.sequenceBlocks);
  const addSequenceBlock = useAppStore((state) => state.addSequenceBlock);
  const reorderSequenceBlocks = useAppStore(
    (state) => state.reorderSequenceBlocks,
  );
  const songContext = useAppStore((state) => state.songContext);
  const updateSongContext = useAppStore((state) => state.updateSongContext);
  const systemLogs = useAppStore((state) => state.systemLogs);
  const appendLogsFromPayload = useAppStore((state) => state.appendLogsFromPayload);
  const mcpLogs = useAppStore((state) => state.systemLogs);
  const addSystemLog = useAppStore((state) => state.addSystemLog);
  const expertChat = useAppStore((state) => state.expertChat);
  const addExpertChat = useAppStore((state) => state.addExpertChat);
  const hasExecutedRuntime = useAppStore((state) => state.hasExecutedRuntime);

  const duplicateBlock = (id: string) => {
    const block = sequenceBlocks.find((b) => b.id === id);
    if (block) addSequenceBlock({ ...block, id: `sb_${Date.now()}` });
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [trackViewMode, setTrackViewMode] = useState<"media" | "builder">(
    "media",
  );
  const [prompt, setPrompt] = useState("");
  const controls = useAnimation();
  
  const [beat, setBeat] = useState(0);
  
  const [expertInput, setExpertInput] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const isTouch = typeof window !== 'undefined' && window.matchMedia("(any-pointer: coarse)").matches;
  const [lyrics, setLyrics] = useState<Array<{ time: number; text: string }>>(
    [],
  );
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [kgData, setKgData] = useState<any>(null);
  const [voiceMod, setVoiceMod] = useState({
    pitch: 1.0,
    formant: 1.0,
    autotune: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsProxyRef = useRef<AbacusWebSocketProxy | null>(null);

  useEffect(() => {
    // Initialize Abacus WebSocket proxy for agent chat
    const proxy = new AbacusWebSocketProxy();
    proxy.connect().then((connected) => {
      // Intentionally silent or logged inside AbacusWebSocketProxy itself
    });
    wsProxyRef.current = proxy;

    return () => {
      proxy.close();
    };
  }, []);

  const [layoutMode, setLayoutMode] = useState<"video" | "image" | "duo">(
    "video",
  );
  const [lastTapTime, setLastTapTime] = useState(0);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [lastScrollTime, setLastScrollTime] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const NAV_ITEMS = [
    { id: 0, icon: <Music className="w-6 h-6" />, label: "Music" },
    { id: 1, icon: <Mic className="w-6 h-6" />, label: "Voice" },
    { id: 2, icon: <ImageIcon className="w-6 h-6" />, label: "Image" },
    { id: 3, icon: <Video className="w-6 h-6" />, label: "Video" },
    { id: 4, icon: <Lightbulb className="w-6 h-6" />, label: "Light" },
    { id: 5, icon: <CloudFog className="w-6 h-6" />, label: "Lasers" },
    { id: 6, icon: <Code className="w-6 h-6" />, label: "Agent" },
    { id: 7, icon: <Activity className="w-6 h-6" />, label: "Dance" },
    { id: 8, icon: <Activity className="w-6 h-6" />, label: "AMCA" },
    { id: 9, icon: <Radar className="w-6 h-6" />, label: "VMCA" },
    { id: 10, icon: <Piano className="w-6 h-6" />, label: "MIDI" },
    { id: 11, icon: <Shield className="w-6 h-6" />, label: "Spark" },
    { id: 12, icon: <Monitor className="w-6 h-6" />, label: "Project" },
    { id: 13, icon: <Ghost className="w-6 h-6" />, label: "Hologram" },
    { id: 14, icon: <Camera className="w-6 h-6" />, label: "AR Lens" },
    { id: 15, icon: <Mic className="w-6 h-6" />, label: "Record" },
    { id: 16, icon: <ScanLine className="w-6 h-6" />, label: "Scan 3D" },
    { id: 17, icon: <User className="w-6 h-6" />, label: "Tracking" },
    { id: 18, icon: <Workflow className="w-6 h-6" />, label: "WF Build" },
    { id: 19, icon: <Activity className="w-6 h-6" />, label: "X-Bugger" },
    { id: 20, icon: <MessageSquare className="w-6 h-6" />, label: "X-Msg" },
    { id: 21, icon: <Layout className="w-6 h-6" />, label: "Comp Fac" },
    { id: 22, icon: <Network className="w-6 h-6" />, label: "Data Rtr" },
    { id: 23, icon: <Box className="w-6 h-6" />, label: "3D Stage" },
    { id: 24, icon: <Brain className="w-6 h-6" />, label: "Sandbox" },
    { id: 25, icon: <Cuboid className="w-6 h-6" />, label: "Kinetix" },
    { id: 26, icon: <Users className="w-6 h-6" />, label: "Arch" },
  ];

  const LOOP_ITEMS = [
    { id: -1, icon: <Play className="w-6 h-6" />, label: "Player" },
    { id: -2, icon: <Layers className="w-6 h-6" />, label: "Sequencer" },
    { id: -3, icon: <SlidersHorizontal className="w-6 h-6" />, label: "Mixer" },
    { id: -4, icon: <Copy className="w-6 h-6" />, label: "Sampler" },
    { id: -5, icon: <Workflow className="w-6 h-6" />, label: "Canvas" },
    { id: -6, icon: <Code className="w-6 h-6" />, label: "JSON" },
  ];

  const currentPage = MATRIX_SCHEMA[currentVerticalIndex] || MATRIX_SCHEMA[0];
  const currentHorizontalPanels = Object.keys(currentPage.panels)
    .map(Number)
    .sort((a, b) => a - b);
  const minH = currentHorizontalPanels[0] || 0;
  const maxH = currentHorizontalPanels[currentHorizontalPanels.length - 1] || 0;

  const currentBId = {
    xmap_canvas: null,
    xmap_json: null,
    sampler: "node-builder-sampler-editor",
    mixer: "node-builder-mixer",
    sequencer: "node-builder-sequencer",
    loop_player: "node-builder-loop-player",
    music: "node-builder-music-gen",
    voice: "node-builder-voice-gen",
    image: "node-builder-image-gen",
    video: "node-builder-video-gen",
    light: "node-builder-light-gen",
    laser: "node-builder-sfx-gen",
    code: "node-builder-agent-gen",
    dance: "node-builder-dance-gen",
    amca: "node-builder-amca",
    vmca: "node-builder-vmca",
    midi: "node-builder-midi",
    spark_fingerprinting: "node-builder-spark-fingerprinting",
    projection_mapper: "node-builder-projection-mapper",
    hologram: "node-builder-hologram",
    ar_presets: "node-builder-ar-presets",
    mic_recorder: "node-builder-mic-recorder",
    surface_scanner: "node-builder-surface-scanner",
    video_tracking: "node-builder-video-tracking",
    wf_builder: "node-builder-wf-builder",
    x_bugger: "node-builder-x-bugger",
    x_messenger: "node-builder-x-messenger",
    component_factory: "node-builder-component-factory",
    data_router: "node-builder-data-router",
    stage_builder: "node-stage-builder",
    agent_sandbox: "node-agent-sandbox",
    kinetix_gen: "node-kinetix-gen",
    agent_architect: "node-agent-architect",
  }[currentPage.id as string];

  const currentBNode = currentBId
    ? useWorkflowStore.getState().nodes.find((n) => n.id === currentBId)
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [expertChat]);

  const handleVertical = (direction: -1 | 1) => {
    let next = currentVerticalIndex + direction;
    const maxIndex = Math.max(...Object.keys(MATRIX_SCHEMA).map(Number));
    const minIndex = Math.min(...Object.keys(MATRIX_SCHEMA).map(Number));

    if (next > maxIndex) next = minIndex;
    if (next < minIndex) next = maxIndex;

    useAppStore.getState().setNavigation(next, 0, direction);
  };

  useEffect(() => {
    const handleScrollStart = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    };

    window.addEventListener("wheel", handleScrollStart, { passive: true });
    window.addEventListener("touchmove", handleScrollStart, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleScrollStart);
      window.removeEventListener("touchmove", handleScrollStart);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Navigation & Gesture handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      )
        return;

      if (e.key === "ArrowLeft" && currentHorizontalIndex > minH) {
        useAppStore
          .getState()
          .setNavigation(currentVerticalIndex, currentHorizontalIndex - 1);
      } else if (e.key === "ArrowRight" && currentHorizontalIndex < maxH) {
        useAppStore
          .getState()
          .setNavigation(currentVerticalIndex, currentHorizontalIndex + 1);
      } else if (e.key === "ArrowUp") {
        handleVertical(-1); // Up arrow traverses loop backwards
      } else if (e.key === "ArrowDown") {
        handleVertical(1); // Down arrow traverses loop forwards
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentHorizontalIndex, currentVerticalIndex, minH, maxH]);

  // Context Location Tracker
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateSongContext({
            location: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              semantic: "Urban Center",
            },
            movementType:
              pos.coords.speed && pos.coords.speed > 1
                ? "walking"
                : "stationary",
            timeOfDay:
              new Date().getHours() > 18 || new Date().getHours() < 6
                ? "Night"
                : "Day",
          });
          addLog("sys: Context updated with Spatial Geolocation data.");
        },
        () => {
          addLog(
            "warn: Geolocation permission denied or unavailable for context.",
          );
        },
      );
    }
  }, []);

  const [isLocalMode, setIsLocalMode] = useState(false);

  const toggleLocalMode = () => {
    setIsLocalMode((prev) => !prev);
    if (!isLocalMode) {
      addLog("sys: initializing transformers.js & WebGPU...");
      setTimeout(() => addLog("sys: local model loaded (WebGPU/WASM)"), 1500);
    } else {
      addLog("sys: reverting to cloud inference");
    }
  };

  const addLog = (message: string) => {
    addSystemLog(message);
  };

  useEffect(() => {
    const builderEdges = useWorkflowStore
      .getState()
      .edges.filter((e) => e.data?.isBuilderEdge);
    if (builderEdges.length > 0) {
      setTimeout(() => {
        builderEdges.forEach((e, i) => {
          setTimeout(
            () => {
              let plan = e.data?.plan as any;
              if (!plan && e.data?.planRef) {
                const node = useWorkflowStore
                  .getState()
                  .nodes.find((n) => n.data?.plan?.taskId === e.data?.planRef);
                if (node) {
                  plan = node.data?.plan;
                }
              }
              if (plan) {
                const unifiedLog = `[XMAP BLD EDGE CALLBACK]\nStatus: ${plan.devStatus.toUpperCase()}\nTask: ${plan.taskId}\nStage: ${plan.planId}\nSize: ${plan.engineeringSize}\nTarget: ${plan.goal}\nReq: ${plan.goalSuccessRequirement || "N/A"}`;
                addLog(unifiedLog);
                if (plan.devStatus !== "complete") {
                  addExpertChat({ role: 'assistant', text: `System Alert: Builder Edge component ${plan.taskId} is hit but status is ${plan.devStatus}. Please check the X-Bugger logs for the unified Edge callback payload.` });
                }
              }
            },
            i * 300 + 500,
          );
        });
      }, 1000);
    }
  }, []);

  // Beat glow tracking
  useEffect(() => {
    let interval: any;
    if (audioUrl) {
      interval = setInterval(() => {
        setBeat((b) => (b + 1) % 4);
      }, 500); // roughly 120 BPM
    } else {
      interval = setInterval(() => {
        setBeat((b) => (b + 1) % 4);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      let idx = -1;
      for (let i = lyrics.length - 1; i >= 0; i--) {
        if (lyrics[i].time <= time) {
          idx = i;
          break;
        }
      }
      setCurrentLyricIndex(idx);
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [lyrics]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    const musicGenNode = useWorkflowStore.getState().nodes.find(n => n.id === "node-builder-music-gen");
    if (musicGenNode && musicGenNode.data?.status !== "complete") {
      const plan = musicGenNode.data.plan as any;
      const errorLog = `[XMAP EXCEPTION] Orchestrator halted.\nNode: ${musicGenNode.id}\nStatus: ${plan?.devStatus}\nTask: ${plan?.taskId}\nGoal: ${plan?.goal}`;
      addLog(errorLog);
      addExpertChat({ role: 'assistant', text: `[POLICY VIOLATION PREVENTED]: Media generation requested, but the Component Factory reports that ${plan?.taskId || musicGenNode.id} is not built (${plan?.devStatus}). Orchestrator halted. Please refer to X-Bugger logs and build the component via JSON workflow.` });
      setPrompt("");
      setIsGenerating(false);
      return;
    }

    // Using unified MCP orchestrator
    const request = buildPow3rRequest("GENERATE_MEDIA", {
      prompt,
      isLocal: isLocalMode,
    });

    const response = await executePow3rWorkflow(request, async (data) => {
      addLog(
        `sys: AI Agent refining and boosting prompt using context [${songContext.timeOfDay}]`,
      );
      const enhanced = await enhancePrompt(
        `${data.prompt}. Time: ${songContext.timeOfDay}. Movement: ${songContext.movementType}.`,
      );

      const [videoUri, img, audioRes, generatedLyrics] = await Promise.all([
        generateVideoFromPrompt(enhanced).catch(() => null),
        generateImageFromPrompt(enhanced).catch(() => null),
        generateAudio(enhanced, data.isLocal),
        generateLyrics(enhanced),
      ]);

      return { videoUri, img, audioRes, generatedLyrics };
    });

    appendLogsFromPayload(response);

    if (response.status === "success" && response.data) {
      const { videoUri, img, audioRes, generatedLyrics } = response.data;
      if (videoUri) {
        setGeneratedVideo(videoUri);
        setGeneratedImage(img);
        addLog(`sys: Cinematic video loop generated successfully via Veo`);
        toast.success("Cinematic Video Generated", { description: "Veo loop loaded." });
      } else if (img) {
        setGeneratedImage(img);
        setGeneratedVideo(null);
        addLog(`sys: Visual media frame generated successfully`);
        toast.success("Visual Media Generated", { description: "Image asset loaded." });
      } else {
        addLog(`error: Media frames failed. Continuing with audio only.`);
      }

      setAudioUrl(audioRes.audioUrl);
      setLyrics(generatedLyrics);

      if (audioRef.current) {
        audioRef.current.src = audioRes.audioUrl;
        audioRef.current.play().catch((e) => console.log("Autoplay blocked"));
        audioRef.current.playbackRate = voiceMod.pitch;
      }

      addLog(
        isLocalMode
          ? `event: local_response_ready`
          : `event: response_ready [mdat + adat synced]`,
      );
    } else {
      addLog(`error: unified generation execution failed`);
      toast.error("Generation Failed");
    }

    setIsGenerating(false);
  };

  const tapRef = useRef({ time: 0, count: 0 });

  const triggerSTT = async () => {
    const micGenNode = useWorkflowStore.getState().nodes.find(n => n.id === "node-builder-mic-recorder");
    if (micGenNode && micGenNode.data?.status !== "complete") {
      const plan = micGenNode.data.plan as any;
      const errorLog = `[XMAP EXCEPTION] Orchestrator halted.\nNode: ${micGenNode.id}\nStatus: ${plan?.devStatus}\nTask: ${plan?.taskId}\nGoal: ${plan?.goal}`;
      addLog(errorLog);
      addExpertChat({ role: 'assistant', text: `[POLICY VIOLATION PREVENTED]: Media recording requested, but the Component Factory reports that ${plan?.taskId || micGenNode.id} is not built (${plan?.devStatus}). Orchestrator halted. Please refer to X-Bugger logs and build the component via JSON workflow.` });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addLog("error: SpeechRecognition API not supported in this browser.");
      return;
    }

    addLog("system: Initializing recording 🎙️... Listening...");
    setIsGenerating(true);

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      addLog(`user[voice]: "${transcript}"`);

      await edgeAgent.saveChatMessage(
        "contact@medialocal.com",
        "sys_agent",
        transcript,
        "user",
      );

      addLog(`sys: Agent enhancing prompt...`);
      const enhanced = await enhancePrompt(transcript);

      await edgeAgent.saveChatMessage(
        "contact@medialocal.com",
        "sys_agent",
        enhanced,
        "agent",
      );
      addLog(`sys: Enhanced: "${enhanced}"`);

      const ragContext = await edgeAgent.ragQuery(
        "contact@medialocal.com",
        enhanced,
      );
      addLog(`sys: UKG/AKG Vector Similarity: ${ragContext.vector_similarity}`);

      const request = buildPow3rRequest("PROCESS_AUDIO", {
        prompt: enhanced,
        ragContext,
      });
      const response = await executePow3rWorkflow(request, async () => {
        await new Promise((r) => setTimeout(r, 1500));
        return { success: true, mode: currentPage.title };
      });
      appendLogsFromPayload(response);
      toast.success("Voice Recording Processed", { description: `Audio data passed to ${currentPage.title}` });
      setIsGenerating(false);
    };

    recognition.onerror = (event: any) => {
      addLog(`error: Speech recognition failed (${event.error})`);
      toast.error("Speech Recognition Failed", { description: `Error: ${event.error}` });
      setIsGenerating(false);
    };

    recognition.onend = () => {
      setTimeout(() => setIsGenerating(false), 500); 
    };

    recognition.start();
  };

  const handleMediaTap = () => {
    const now = Date.now();
    tapRef.current.count += 1;

    if (now - tapRef.current.time > 300) {
      tapRef.current.count = 1;
    }

    tapRef.current.time = now;

    setTimeout(() => {
      if (
        tapRef.current.count === 1 &&
        Date.now() - tapRef.current.time >= 300
      ) {
        triggerSTT();
      } else if (tapRef.current.count === 2) {
        setLayoutMode((prev) =>
          prev === "video" ? "image" : prev === "image" ? "duo" : "video",
        );
        addLog("gesture: 2-tap -> layout switched");
        tapRef.current.count = 0;
      }
    }, 350);
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 60;

    // Determine primary swipe axis
    if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
      // Horizontal swipe
      if (info.offset.x > threshold) {
        // Swipe right (go Left)
        if (currentHorizontalIndex > minH) {
          useAppStore
            .getState()
            .setNavigation(currentVerticalIndex, currentHorizontalIndex - 1);
          addLog(`gesture: swipe_right -> panel transition`);
        }
      } else if (info.offset.x < -threshold) {
        // Swipe left (go Right)
        if (currentHorizontalIndex < maxH) {
          useAppStore
            .getState()
            .setNavigation(currentVerticalIndex, currentHorizontalIndex + 1);
          addLog(`gesture: swipe_left -> panel transition`);
        }
      }
    } else {
      // Vertical swipe
      if (info.offset.y > threshold) {
        // Swipe down (go Prev)
        handleVertical(-1);
        addLog(`gesture: swipe_down -> page transition`);
      } else if (info.offset.y < -threshold) {
        // Swipe up (go Next)
        handleVertical(1);
        addLog(`gesture: swipe_up -> page transition`);
      }
    }
    controls.start({
      x: 0,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastScrollTime < 600) return; // Debounce wheel

    const threshold = 30;
    const { deltaX, deltaY } = e;

    let navigated = false;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold) {
        if (currentHorizontalIndex < maxH) {
          useAppStore
            .getState()
            .setNavigation(currentVerticalIndex, currentHorizontalIndex + 1);
          addLog(`gesture: wheel_left -> panel transition`);
          navigated = true;
        }
      } else if (deltaX < -threshold) {
        if (currentHorizontalIndex > minH) {
          useAppStore
            .getState()
            .setNavigation(currentVerticalIndex, currentHorizontalIndex - 1);
          addLog(`gesture: wheel_right -> panel transition`);
          navigated = true;
        }
      }
    } else {
      // Check if we are hovering over a scrollable element
      let target = e.target as HTMLElement | null;
      let shouldNavigateVertical = true;
      
      while (target && target !== e.currentTarget) {
        const style = window.getComputedStyle(target);
        if (
          style.overflowY === 'auto' || 
          style.overflowY === 'scroll' || 
          target.classList.contains('custom-scrollbar') || 
          target.tagName.toLowerCase() === 'textarea' ||
          target.classList.contains('overflow-y-auto')
        ) {
            const isScrollable = target.scrollHeight > target.clientHeight;
            if (isScrollable) {
                // If it is a scrollable container, never navigate vertically via Wheel. 
                // They must scroll outside of it to navigate between views.
                shouldNavigateVertical = false;
                break;
            }
        }
        target = target.parentElement;
      }

      if (shouldNavigateVertical) {
          if (deltaY > threshold) {
            handleVertical(1);
            addLog(`gesture: wheel_down -> page transition`);
            navigated = true;
          } else if (deltaY < -threshold) {
            handleVertical(-1);
            addLog(`gesture: wheel_up -> page transition`);
            navigated = true;
          }
      }
    }
    if (navigated) setLastScrollTime(now);
  };

  const handleSamplerImport = () => {
    addLog("action: File Browser -> Import Sampler (.wav)");
  };

  const handleExportJSON = () => {
    addLog("action: Export -> Native Slide JSON");
    try {
      const dataStr = formatWorkflowToWebTT(sequenceBlocks, []);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = "pow3r-workflow.json";
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
      addLog("sys: webTT export successful");
    } catch (err) {
      addLog("error: Export failed");
    }
  };

  const handleDeployToCF = async () => {
    addLog("action: Deploying to Cloudflare Workflows...");
    const request = buildPow3rRequest("DEPLOY_CLOUDFLARE", {
      blocks: sequenceBlocks,
    });

    const response = await executePow3rWorkflow(request, async (data) => {
      return await deployToCloudflareWorkflows("wf-cloudflare-workers", {
        blocks: data.blocks,
      });
    });

    appendLogsFromPayload(response);

    if (response.status === "success") {
      addLog("sys: CF AI Gateway bound 🟢");
      addLog("sys: CF Workplace deployed 🚀");
    } else {
      addLog("error: CF deploy failed");
    }
  };

  const handleExpertSend = async () => {
    if (!expertInput.trim()) return;
    const promptText = expertInput;
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    addExpertChat({ id: userMsgId, role: "user" as const, text: promptText });
    addExpertChat({ id: assistantMsgId, role: "assistant" as const, text: "..." });
    setExpertInput("");

    await edgeAgent.saveChatMessage(
      "contact@medialocal.com",
      "sys_agent",
      promptText,
      "user",
    );

    addLog(`sys: Querying UKG / AKG via AI Gateway...`);
    const ragContext = await edgeAgent.ragQuery(
      "contact@medialocal.com",
      promptText,
    );
    addLog(`sys: Vector Similarity Matches: ${ragContext.vector_similarity}`);

    let agentResponseText = "";

    if (wsProxyRef.current) {
      wsProxyRef.current.onMessage((data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "chunk") {
            agentResponseText += parsed.content;
            const updateFn = useAppStore.getState().updateExpertChat;
            updateFn(assistantMsgId, agentResponseText);
          } else if (parsed.type === "done") {
            edgeAgent.saveChatMessage(
              "contact@medialocal.com",
              "sys_agent",
              agentResponseText,
              "agent",
            );
          }
        } catch (err) {}
      });
      wsProxyRef.current.sendMessage({
        prompt: promptText,
        context: ragContext,
      });
    } else {
      const request = buildPow3rRequest("AGENT_CHAT", {
        expertInput: promptText,
        newHistory: expertChat,
        ragContext,
      });
      const response = await executePow3rWorkflow(request, async (data) => {
        const gHistory = data.newHistory.map((m: any) => ({
          role: m.role as "user" | "assistant",
          text: m.text,
        }));
        return await askExpertAgent(data.expertInput, gHistory);
      });

      appendLogsFromPayload(response);

      if (response.status === "success" && response.data) {
        agentResponseText = response.data as string;
        const updateFn = useAppStore.getState().updateExpertChat;
        updateFn(assistantMsgId, agentResponseText);
        await edgeAgent.saveChatMessage(
          "contact@medialocal.com",
          "sys_agent",
          agentResponseText,
          "agent",
        );
      } else {
        addLog(`error: ${response.error || "Unknown Chat Error"}`);
      }
    }
  };

  const handleAbacusSync = async () => {
    addLog("action: Syncing to Abacus Knowledge Base...");
    const request = buildPow3rRequest("SYNC_ABACUS", { target: "deep-agent" });
    const response = await executePow3rWorkflow(request, async () => {
      const apiKey = import.meta.env.VITE_ABACUS_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Abacus.AI API Key");
      }
      const res = await fetch(
        "https://api.abacus.ai/api/v0/syncKnowledgeBase",
        {
          method: "POST",
          headers: { apiKey: apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ name: "deep-agent-kb" }),
        },
      );
      if (!res.ok) throw new Error("Abacus Sync Failed");
      return { synced: true };
    });

    appendLogsFromPayload(response);

    if (response.status === "success") {
      addLog("sys: DeepAgent workflow connected 🧠");
    } else {
      addLog("error: Sync failed");
    }
  };

  const handleAudit = async () => {
    addLog("sys: Guardian Policy Engine running check...");

    const request = buildPow3rRequest("AUDIT_WORKFLOW", {
      blocks: sequenceBlocks,
    });
    const response = await executePow3rWorkflow(request, async (data) => {
      return await runGuardianAudit(data.blocks);
    });

    appendLogsFromPayload(response);

    if (response.status === "success" && response.data) {
      const result = response.data;
      if (result.passed) {
        addLog(
          `sys: Audit pass: ${result.violations.length} violations found 🛡️`,
        );
        addLog(
          `action: Telemetry Observer ingested run logs [${result.telemetryId}]`,
        );
      }
    } else {
      addLog("error: Guardian Audit failed");
    }
  };

  const handleVaultSync = async () => {
    const request = buildPow3rRequest("UPDATE_KNOWLEDGE_GRAPH", {});
    const response = await executePow3rWorkflow(request, async () => {
      const state = await syncObsidianVault();
      const graph = await buildDesignKnowledgeGraph();
      return { state, graph };
    });

    appendLogsFromPayload(response);

    if (response.status === "success" && response.data) {
      setKgData(response.data.graph);
      addLog(
        `sys: loaded knowledge graph to R3F (${response.data.state.nodesSynced} nodes synced)`,
      );
      toast.success("Knowledge Graph Updated", { description: `${response.data.state.nodesSynced} nodes synced` });
    } else {
      addLog("error: Obsidian sync failed");
      toast.error("Vault Sync Failed");
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-8 gap-8 relative overflow-hidden">
      {/* Universal Screen Edge Lighting Effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-shadow duration-300 z-50 pointer-events-none"
        style={{
          boxShadow: isGenerating
            ? "inset 0 0 150px 40px rgba(236, 72, 153, 0.4)"
            : beat === 0
              ? "inset 0 0 100px 20px rgba(6, 182, 212, 0.3)"
              : "inset 0 0 40px 10px rgba(6, 182, 212, 0.1)",
        }}
      ></div>
      <audio ref={audioRef} loop />

      {/* X-Bugger: Unified Telemetry & Toast Panel */}
      <div className="hidden lg:flex w-80 h-[700px] bg-[#0a0a0a] border border-cyan-500/20 rounded-3xl flex-col overflow-hidden shadow-[0_0_30px_rgba(0,240,255,0.05)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-neon-pink" />
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="font-mono text-xs font-bold text-cyan-400 tracking-widest uppercase">
              X-Bugger Edge Telemetry
            </h3>
          </div>
          <button
            onClick={handleSamplerImport}
            className="text-zinc-500 hover:text-cyan-400 p-1 bg-zinc-900 rounded"
            title="Sampler Import"
          >
            <Import className="w-4 h-4" />
          </button>
        </div>

        {/* Unified Toasts & Logs */}
        <div className="flex-1 p-4 flex flex-col gap-3 font-mono text-[10px] overflow-hidden custom-scrollbar">
          {mcpLogs.length === 0 ? (
            <div className="text-zinc-600 flex flex-col items-center justify-center h-full gap-2">
              <Workflow className="w-8 h-8 opacity-20" />
              <span>Awaiting XMAP Workflow Edges...</span>
            </div>
          ) : (
            mcpLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-[#141414] border border-cyan-500/20 text-cyan-300 break-words flex flex-col gap-1 shadow-md relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500/50" />
                <div className="flex justify-between items-center opacity-50 mb-1 border-b border-zinc-800/50 pb-1">
                  <span>[EDGE_EVENT]</span>
                  <span>
                    {new Date().toISOString().split("T")[1].substring(0, 8)}
                  </span>
                </div>
                <span>{log.message}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div
        className="flex-1 w-full h-full bg-[#0a0a0a] border border-cyan-500/20 lg:rounded-[2rem] overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.05)] flex flex-col relative
          lg:ml-20 mx-auto max-w-screen-2xl"
      >
        {/* Header bar / notches mock */}
        <div className="h-8 w-full flex justify-center items-end absolute top-0 z-50 pointer-events-none">
          <div className="w-32 h-6 bg-zinc-950 rounded-b-xl border-x border-b border-zinc-800"></div>
        </div>

        {/* Main Swipe Container */}
        <div
          className="relative flex-1 w-full overflow-hidden"
          onWheel={handleWheel}
        >
          <AnimatePresence
            custom={verticalDirection}
            initial={false}
            mode="popLayout"
          >
            {[currentVerticalIndex].map((vIndex) => {
              const page = MATRIX_SCHEMA[vIndex] || MATRIX_SCHEMA[0];
              const hPanels = Object.keys(page.panels)
                .map(Number)
                .sort((a, b) => a - b);
              const minimumH = hPanels[0] || 0;

              return (
                <motion.div
                  key={vIndex}
                  custom={verticalDirection}
                  variants={{
                    enter: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%" }),
                    center: { y: "0%" },
                    exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%" }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 w-full h-full"
                >
                  <motion.div
                    className="w-full h-full absolute inset-0 flex"
                    initial={{
                      x: `${-(currentHorizontalIndex - minimumH) * (100 / hPanels.length)}%`,
                    }}
                    animate={{
                      x: `${-(currentHorizontalIndex - minimumH) * (100 / hPanels.length)}%`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ width: `${hPanels.length * 100}%` }}
                    onPanEnd={isTouch ? handleDragEnd : undefined}
                  >
                    {hPanels.map((hIndex) => {
                      const pDef = page.panels[hIndex];
                      if (!pDef) return null;
                      const isMain = hIndex === 0;
                      const legacyPage = MAIN_PAGES_SCHEMA.find(
                        (p) => p.id === page.id,
                      );
                      const legacyControls = legacyPage
                        ? hIndex < 0
                          ? legacyPage.panels.left.controls
                          : hIndex > 0
                            ? legacyPage.panels.right.controls
                            : []
                        : [];

                      const bId = {
                        music: "node-builder-music-gen",
                        mixer: "node-builder-mixer",
                        sequencer: "node-builder-sequencer",
                        loop_player: "node-builder-loop-player",
                        voice: "node-builder-voice-gen",
                        image: "node-builder-image-gen",
                        video: "node-builder-video-gen",
                        light: "node-builder-light-gen",
                        laser: "node-builder-sfx-gen",
                        code: "node-builder-agent-gen",
                        sampler: "node-builder-sampler-editor",
                        dance: "node-builder-dance-gen",
                        amca: "node-builder-amca",
                        vmca: "node-builder-vmca",
                        midi: "node-builder-midi",
                        spark_fingerprinting:
                          "node-builder-spark-fingerprinting",
                        projection_mapper: "node-builder-projection-mapper",
                        hologram: "node-builder-hologram",
                        ar_presets: "node-builder-ar-presets",
                        mic_recorder: "node-builder-mic-recorder",
                        surface_scanner: "node-builder-surface-scanner",
                        video_tracking: "node-builder-video-tracking",
                        wf_builder: "node-builder-wf-builder",
                        x_bugger: "node-builder-x-bugger",
                        x_messenger: "node-builder-x-messenger",
                        component_factory: "node-builder-component-factory",
                        data_router: "node-builder-data-router",
                        stage_builder: "node-stage-builder",
                        agent_sandbox: "node-agent-sandbox",
                        kinetix_gen: "node-kinetix-gen",
                        agent_architect: "node-agent-architect",
                      }[page.id as string];

                      const bNode = bId
                        ? useWorkflowStore
                            .getState()
                            .nodes.find((n) => n.id === bId)
                        : null;

                      if (isMain) {
                        return (
                          <div
                            key={hIndex}
                            id="media-container-area"
                            className="h-full relative flex flex-col bg-zinc-950 border-r border-zinc-900 overflow-hidden"
                            style={{ width: `${100 / hPanels.length}%` }}
                          >
                            {/* Header */}
                            <div className="p-4 flex justify-between items-center bg-zinc-900/60 backdrop-blur z-20 absolute top-0 w-full">
                              <h2 className="font-heading text-cyan-400 text-lg uppercase tracking-wider text-shadow-glow">
                                {page.title}
                              </h2>
                              <div className="flex gap-2 items-center">
                                {/* View Mode Toggle */}
                                {(!bNode ||
                                  bNode.data.plan?.devStatus ===
                                    "complete") && (
                                  <div className="flex bg-zinc-800 rounded-lg p-1 mr-4">
                                    <button
                                      onClick={() => setTrackViewMode("media")}
                                      className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${trackViewMode === "media" ? "bg-zinc-700 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"}`}
                                    >
                                      MEDIA
                                    </button>
                                    <button
                                      onClick={() =>
                                        setTrackViewMode("builder")
                                      }
                                      className={`px-3 py-1 rounded text-xs font-mono font-bold transition-colors ${trackViewMode === "builder" ? "bg-zinc-700 text-neon-pink" : "text-zinc-500 hover:text-zinc-300"}`}
                                    >
                                      BUILDER
                                    </button>
                                  </div>
                                )}
                                <button className="text-zinc-500 hover:text-cyan-400 transition-colors">
                                  <Settings className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {/* Media Window - Swipe Area with Beat Glow */}
                            <div className="w-full h-full flex flex-col items-center justify-center relative group">
                              <motion.div
                                animate={{ opacity: beat === 0 ? 0.3 : 0 }}
                                transition={{ duration: 0.1 }}
                                className="absolute inset-0 bg-cyan-500/20 z-0 pointer-events-none"
                              />

                              {isGenerating && (
                                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
                                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                                </div>
                              )}

                              <motion.div
                                drag={isTouch}
                                dragConstraints={{
                                  top: -10,
                                  left: -10,
                                  right: 10,
                                  bottom: 10,
                                }}
                                dragElastic={0.8}
                                onDragEnd={isTouch ? handleDragEnd : undefined}
                                onClick={(e) => {
                                  if (e.target !== e.currentTarget) {
                                    return;
                                  }
                                  handleMediaTap();
                                }}
                                animate={controls}
                                className="w-full h-full relative cursor-grab active:cursor-grabbing z-20 touch-none flex flex-col md:flex-row"
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none" />

                                {/* Media Rendering based on layoutMode */}
                                {(() => {
                                  if (
                                    bNode &&
                                    (!bNode.data.plan?.devStatus ||
                                      bNode.data.plan?.devStatus !==
                                        "complete" ||
                                      trackViewMode === "builder")
                                  ) {
                                    const data = bNode.data as any;
                                    const getDevStatusColor = (
                                      status: string,
                                    ) => {
                                      switch (status) {
                                        case "open":
                                        case "not-started":
                                          return {
                                            border: "border-orange-500",
                                            text: "text-orange-400",
                                            bg: "bg-orange-500/10",
                                            glow: "shadow-[0_0_20px_rgba(249,115,22,0.3)]",
                                          };
                                        case "in-progress":
                                          return {
                                            border: "border-blue-500",
                                            text: "text-blue-400",
                                            bg: "bg-blue-500/10",
                                            glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]",
                                          };
                                        case "blocked":
                                          return {
                                            border: "border-red-500",
                                            text: "text-red-400",
                                            bg: "bg-red-500/10",
                                            glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
                                          };
                                        case "complete":
                                          return {
                                            border: "border-emerald-500",
                                            text: "text-emerald-400",
                                            bg: "bg-emerald-500/10",
                                            glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
                                          };
                                        default:
                                          return {
                                            border: "border-zinc-500",
                                            text: "text-zinc-400",
                                            bg: "bg-zinc-500/10",
                                            glow: "",
                                          };
                                      }
                                    };

                                    const statusStyle = getDevStatusColor(
                                      data.plan?.devStatus || data.status,
                                    );

                                    return (
                                      <div className="absolute inset-0 flex items-center justify-center p-4 bg-zinc-950/90 z-30">
                                        <div
                                          className={`bg-[#0d0d0d] border ${statusStyle.border} rounded-xl p-8 w-full max-w-2xl shadow-[0_0_40px_rgba(0,0,0,1)]`}
                                        >
                                          <div className="flex justify-between items-center border-b border-zinc-800 pb-6 mb-6">
                                            <h2
                                              className={`font-mono font-bold text-2xl ${statusStyle.text} uppercase tracking-wider`}
                                            >
                                              {data.name}
                                            </h2>
                                            <div
                                              className={`px-4 py-1.5 rounded-lg text-sm font-mono border ${statusStyle.border} ${statusStyle.text} bg-transparent`}
                                            >
                                              {data.plan?.devStatus ||
                                                "pending"}
                                            </div>
                                          </div>

                                          {data.plan && (
                                            <div className="flex flex-col gap-6">
                                              <div className="bg-[#141414] p-6 rounded-lg font-mono text-zinc-300 text-sm leading-relaxed border border-zinc-800/80">
                                                <span className="text-zinc-500 font-bold block mb-3 font-mono">
                                                  GOAL:{" "}
                                                </span>
                                                {data.plan.goal}
                                              </div>

                                              <div className="font-mono bg-[#141414] p-6 rounded-lg border border-zinc-800/80 relative text-sm">
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#0d0d0d] border border-zinc-800 px-4 py-1.5 rounded-full text-zinc-300 text-[10px] tracking-widest uppercase z-10 hidden md:block">
                                                  SWIPE TO NAVIGATE
                                                </div>
                                                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                                  <div className="text-zinc-500 flex justify-between items-center border-b border-zinc-800/50 pb-3">
                                                    <span>SIZE:</span>{" "}
                                                    <span className="text-zinc-300 ml-2 bg-zinc-800/50 px-2 py-0.5 rounded-md">
                                                      {
                                                        data.plan
                                                          .engineeringSize
                                                      }
                                                    </span>
                                                  </div>
                                                  <div className="text-zinc-500 flex justify-between items-center border-b border-zinc-800/50 pb-3 pl-2 sm:pl-4">
                                                    <span>TASK:</span>{" "}
                                                    <span className="text-cyan-400 ml-2">
                                                      {data.plan.taskId}
                                                    </span>
                                                  </div>
                                                  <div className="text-zinc-500 flex justify-between items-center pt-2">
                                                    <span>PLAN:</span>{" "}
                                                    <span className="text-cyan-400 ml-2">
                                                      {data.plan.planId}
                                                    </span>
                                                  </div>
                                                  <div className="text-zinc-500 flex justify-between items-center pt-2 pl-2 sm:pl-4">
                                                    <span>VER:</span>{" "}
                                                    <span className="text-zinc-300 ml-2">
                                                      {data.plan.versionId}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="bg-[#141414] p-6 rounded-lg font-mono text-zinc-300 text-sm leading-relaxed border border-zinc-800/80">
                                                <span className="text-zinc-500 font-bold block mb-3 font-mono">
                                                  SUCCESS REQUIREMENT:{" "}
                                                </span>
                                                {
                                                  data.plan
                                                    .goalSuccessRequirement
                                                }
                                              </div>
                                            </div>
                                          )}

                                          <div className="flex flex-wrap gap-3 mt-4 pt-6 border-t border-zinc-800">
                                            {data.capabilities?.map(
                                              (cap: string) => (
                                                <button
                                                  key={cap}
                                                  className={`px-4 py-2 ${statusStyle.border} border bg-transparent text-sm uppercase font-mono tracking-wider rounded-lg ${statusStyle.text} hover:bg-zinc-900 transition-colors`}
                                                >
                                                  {cap}
                                                </button>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }

                                  return page.id === "xmap_canvas" ? (
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
                                  ) : page.id === "kinetix_gen" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <KinetixGen mode="ui" />
                                    </div>
                                  ) : page.id === "agent_architect" ? (
                                    <div className="absolute inset-0 z-30 bg-[#0a0a0a]">
                                      <AgentArchitect mode="ui" />
                                    </div>
                                  ) : (

                                    <>
                                      {(layoutMode === "video" ||
                                        layoutMode === "duo") &&
                                        generatedVideo && (
                                          <video
                                            src={generatedVideo}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className={`absolute inset-0 object-cover opacity-80 pointer-events-none transition-all duration-1000 ${layoutMode === "duo" ? "w-full h-1/2 md:w-1/2 md:h-full top-0 left-0" : "w-full h-full"}`}
                                          />
                                        )}

                                      {(layoutMode === "image" ||
                                        layoutMode === "duo" ||
                                        (!generatedVideo &&
                                          layoutMode === "video")) &&
                                        generatedImage && (
                                          <motion.div
                                            animate={{
                                              scale: beat === 0 ? 1.05 : 1,
                                            }}
                                            transition={{ duration: 0.4 }}
                                            className={`absolute object-cover opacity-80 bg-cover bg-center pointer-events-none transition-all duration-1000 ${layoutMode === "duo" ? "w-full h-1/2 md:w-1/2 md:h-full bottom-0 right-0" : "inset-0 w-full h-full"}`}
                                            style={{
                                              backgroundImage: `url('${generatedImage}')`,
                                            }}
                                          />
                                        )}
                                    </>
                                  );
                                })()}

                                {/* Karaoke Text Overlay */}
                                <AnimatePresence>
                                  {lyrics.length > 0 &&
                                    currentLyricIndex >= 0 && (
                                      <motion.div
                                        key={currentLyricIndex}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute inset-x-0 bottom-24 flex items-center justify-center pointer-events-none z-[100] px-4"
                                      >
                                        <h2 className="text-2xl md:text-3xl font-sans font-black text-white text-center leading-tight [text-shadow:_0_0_10px_rgb(0_0_0_/_100%),_0_4px_30px_rgb(0_0_0_/_80%)] drop-shadow-2xl">
                                          {lyrics[currentLyricIndex]?.text}
                                        </h2>
                                      </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Visualizer bars mock */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-[3px] z-20 h-16 w-3/4 justify-center pointer-events-none">
                                  {[...Array(24)].map((_, i) => {
                                    const heightBase = Math.max(
                                      10,
                                      ((Math.sin((Date.now() / 200) + i * 1.3) * 0.5) + 0.5) * 60,
                                    );
                                    const isBeatBar = i % 4 === 0;
                                    const currentHeight =
                                      isBeatBar && beat === 0
                                        ? 100
                                        : heightBase;

                                    return (
                                      <motion.div
                                        key={i}
                                        animate={{
                                          height: `${currentHeight}%`,
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className="w-1.5 bg-cyan-400 rounded-t-sm shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                                        style={{
                                          opacity: isBeatBar ? 0.9 : 0.6,
                                        }}
                                      />
                                    );
                                  })}
                                </div>

                                {/* Gesture hints */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-50">
                                  <div className="px-3 py-1.5 rounded-full bg-zinc-950/80 backdrop-blur border border-zinc-800 text-[10px] font-sans font-bold text-zinc-400 tracking-wider">
                                    SWIPE TO NAVIGATE
                                  </div>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        );
                      }

                      // Non-Main Side Panels
                      return (
                        <div
                          key={hIndex}
                          className="h-full bg-zinc-950 p-6 portrait:pt-20 lg:pt-6 overflow-y-auto border-r border-zinc-900 flex flex-col gap-6"
                          style={{ width: `${100 / hPanels.length}%` }}
                        >
                          <h2 className="font-heading text-cyan-400 text-xl tracking-wider shrink-0">
                            {pDef.title}
                          </h2>
                          {pDef.subtitle && (
                            <p className="text-zinc-500 font-mono text-xs">
                              {pDef.subtitle}
                            </p>
                          )}

                          <div className="flex flex-col gap-4 shrink-0">
                            {legacyControls.map((ctrl) => (
                              <Pow3rControl key={ctrl.id} control={ctrl} />
                            ))}

                            {legacyControls.length === 0 && hIndex !== 0 && (
                              <DynamicPanelRenderer pDef={pDef as any} />
                            )}

                            {page.id === "sampler" && hIndex > 0 && (
                              <button
                                onClick={handleSamplerImport}
                                className="w-full bg-zinc-800 border border-zinc-700 hover:border-cyan-500 text-cyan-400 py-3 rounded-xl font-bold font-mono text-sm shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                              >
                                Import Sequence
                              </button>
                            )}
                            {page.id === "voice" && hIndex > 0 && (
                              <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-[0_0_20px_rgba(251,191,36,0.1)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-amber-500/5 pointer-events-none border border-amber-500/20 rounded-xl" />
                                <span className="text-amber-400 font-bold text-[10px] uppercase mb-3 block tracking-widest">
                                  Global Agent Pitch
                                </span>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="2.0"
                                  step="0.05"
                                  value={voiceMod.pitch}
                                  onChange={(e) =>
                                    setVoiceMod({
                                      ...voiceMod,
                                      pitch: parseFloat(e.target.value),
                                    })
                                  }
                                  className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer relative z-10"
                                />
                              </div>
                            )}
                          </div>

                          {pDef.type === "gallery" && (
                            <div className="flex-1 w-full min-h-[300px]">
                              <GalleryBucket
                                pageId={page.id}
                                panel={hIndex < 0 ? "left" : "right"}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Toggle Controls Button */}
        <button
          onClick={() => setIsPromptOpen(!isPromptOpen)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-cyan-600 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center z-[110] text-zinc-950 hover:bg-cyan-500 transition-transform active:scale-95"
        >
          <MessageSquare className="w-6 h-6" />
        </button>

        {/* Controls Area (Tabs: Generate | Sequencer | Expert) */}
        <AnimatePresence>
          {isPromptOpen && (
            <motion.div
              initial={{ y: "150%" }}
              animate={{ y: 0 }}
              exit={{ y: "150%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-24 right-6 w-[400px] max-w-[90vw] bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 lg:rounded-2xl p-6 flex flex-col gap-4 z-[100] shadow-2xl h-[400px] overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-cyan-500/10 to-transparent"></div>

              <Tabs.Root
                defaultValue="generate"
                className="w-full flex-1 flex flex-col h-full"
              >
                <Tabs.List className="flex border-b border-zinc-800 mb-4 pb-0 items-end">
                  <Tabs.Trigger
                    value="generate"
                    className="flex-1 pb-2 text-xs font-mono text-zinc-500 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 hover:text-zinc-300 transition-all"
                  >
                    GENERATE
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="sequence"
                    className="flex-1 pb-2 text-xs font-mono text-zinc-500 data-[state=active]:text-neon-pink data-[state=active]:border-b-2 data-[state=active]:border-neon-pink hover:text-zinc-300 transition-all"
                  >
                    SEQUENCE
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="expert"
                    className="flex-1 pb-2 text-xs font-mono text-zinc-500 data-[state=active]:text-green-400 data-[state=active]:border-b-2 data-[state=active]:border-green-400 hover:text-zinc-300 transition-all"
                  >
                    EXPERT AI
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="guardian"
                    className="flex-1 pb-2 text-xs font-mono text-zinc-500 data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-400 hover:text-zinc-300 transition-all"
                  >
                    GUARDIAN
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="3dvault"
                    className="flex-1 pb-2 text-xs font-mono text-zinc-500 data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 data-[state=active]:border-indigo-400 hover:text-zinc-300 transition-all"
                  >
                    3D VAULT
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="context"
                    className="flex-1 pb-2 text-xs font-mono text-zinc-500 data-[state=active]:text-amber-400 data-[state=active]:border-b-2 data-[state=active]:border-amber-400 hover:text-zinc-300 transition-all"
                  >
                    CONTEXT
                  </Tabs.Trigger>
                </Tabs.List>

                {/* GENERATE TAB */}
                <Tabs.Content
                  value="generate"
                  className="flex-1 flex flex-col gap-4 outline-none"
                >
                  <div className="flex bg-zinc-900 border border-zinc-800 rounded-full p-1.5 focus-within:border-cyan-500 focus-within:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all">
                    <button className="text-zinc-500 p-2 ml-1">
                      <Music className="w-4 h-4" />
                    </button>
                    <input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                      type="text"
                      placeholder={
                        isLocalMode
                          ? "Prompt WebLLM (Offline)..."
                          : "Prompt Lyria for audio..."
                      }
                      className="bg-transparent border-none outline-none text-sm font-sans flex-1 text-zinc-100 placeholder:text-zinc-600 focus:ring-0"
                    />
                    <button
                      onClick={toggleLocalMode}
                      className={`p-2 transition-colors mr-1 rounded-full ${isLocalMode ? "text-amber-400 bg-amber-900/30" : "text-zinc-500 hover:text-zinc-300"}`}
                      title="Toggle Local Offline Mode"
                    >
                      <WifiOff className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleGenerate}
                      className={`${isLocalMode ? "text-amber-400 bg-amber-900/40 hover:bg-amber-900/60" : "bg-zinc-800 text-cyan-400 hover:bg-cyan-950"} p-2 rounded-full transition-colors mr-1`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 flex-1 justify-center relative">
                    <div className="flex justify-between text-[10px] font-mono text-cyan-500/50">
                      <span>{`0:0${beat}`}</span>
                      <span>0:15 / loop</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full w-full overflow-hidden">
                      <motion.div
                        className={`h-full flex items-center relative ${isLocalMode ? "bg-amber-400" : "bg-cyan-400"}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: 15,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <div className="absolute right-0 w-2 h-2 bg-white rounded-full"></div>
                      </motion.div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 flex justify-between mt-2 px-1">
                      <span>
                        {isLocalMode
                          ? "LOCAL_INF: STANDBY"
                          : "RIFFY_SYNC: ACTIVE"}
                      </span>
                      <span
                        className={
                          isLocalMode ? "text-amber-400" : "text-cyan-500"
                        }
                      >
                        120 BPM
                      </span>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center justify-center gap-8 mt-2">
                    <button
                      className="text-zinc-500 hover:text-cyan-400 transition-colors"
                      onClick={() => {
                        const mixerNode = useWorkflowStore.getState().nodes.find(n => n.id === "node-builder-mixer");
                        if (mixerNode && mixerNode.data?.status !== "complete") {
                          const plan = mixerNode.data.plan as any;
                          addLog(`[XMAP EXCEPTION] Mixer halted.\nTask: ${plan?.taskId}\nStatus: ${plan?.devStatus}`);
                          addExpertChat({ role: 'assistant', text: `[POLICY VIOLATION PREVENTED]: Mixer is not built (${plan?.devStatus}). Orchestrator halted.` });
                          return;
                        }
                        addLog("event: volume_toggle");
                      }}
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        const playerNode = useWorkflowStore.getState().nodes.find(n => n.id === "node-builder-loop-player");
                        if (playerNode && playerNode.data?.status !== "complete") {
                          const plan = playerNode.data.plan as any;
                          addLog(`[XMAP EXCEPTION] Player halted.\nTask: ${plan?.taskId}\nStatus: ${plan?.devStatus}`);
                          addExpertChat({ role: 'assistant', text: `[POLICY VIOLATION PREVENTED]: Loop Player is not built (${plan?.devStatus}). Orchestrator halted.` });
                          return;
                        }

                        addLog("event: play_pause");
                        if (audioRef.current) {
                          if (audioRef.current.paused) audioRef.current.play();
                          else audioRef.current.pause();
                        }
                      }}
                      className="w-12 h-12 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center text-zinc-950 shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all transform hover:scale-105 active:scale-95"
                    >
                      <Play className="w-5 h-5 ml-1" fill="currentColor" />
                    </button>
                    <button
                      className="text-zinc-500 hover:text-cyan-400 transition-colors"
                      onClick={() => {
                        addLog("event: stop");
                        if (audioRef.current) {
                          audioRef.current.pause();
                          audioRef.current.currentTime = 0;
                        }
                      }}
                    >
                      <Square className="w-5 h-5" />
                    </button>
                  </div>
                </Tabs.Content>

                {/* SEQUENCE TAB */}
                <Tabs.Content
                  value="sequence"
                  className="flex-1 flex flex-col outline-none gap-3"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="text-neon-pink">
                      JSON Library / Sequencer
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleExportJSON}
                        className="flex items-center gap-1 hover:text-cyan-400"
                      >
                        <Download className="w-3 h-3" /> Export
                      </button>
                      <button
                        onClick={handleDeployToCF}
                        className="flex items-center gap-1 hover:text-fuchsia-400 text-fuchsia-500/80"
                      >
                        <Cloud className="w-3 h-3" /> Deploy
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center gap-2 pb-2 hide-scrollbar snap-x">
                    {sequenceBlocks.map((block) => (
                      <motion.div
                        key={block.id}
                        layout
                        onClick={() => {
                          const seqNode = useWorkflowStore.getState().nodes.find(n => n.id === "node-builder-sequencer");
                          if (seqNode && seqNode.data?.status !== "complete") {
                            const plan = seqNode.data.plan as any;
                            addLog(`[XMAP EXCEPTION] Sequencer halted.\nTask: ${plan?.taskId}\nStatus: ${plan?.devStatus}`);
                            addExpertChat({ role: 'assistant', text: `[POLICY VIOLATION PREVENTED]: Sequencer is not built (${plan?.devStatus}). Orchestrator halted.` });
                            return;
                          }
                          useAppStore.getState().updateSequenceBlock(block.id, {
                            loopCount: block.loopCount >= 9 ? 0 : block.loopCount + 1,
                          });
                        }}
                        className={`flex-shrink-0 w-24 h-16 bg-zinc-800 border border-zinc-700 hover:border-neon-pink rounded-lg flex flex-col p-2 justify-between snap-center cursor-grab active:cursor-grabbing group relative`}
                      >
                        <span className="text-xs font-sans text-zinc-300 font-medium group-hover:text-white transition-colors truncate">
                          {block.name}
                        </span>

                        <div className="absolute top-1 right-1 px-1 bg-black/50 rounded flex gap-1 items-center">
                          <span className="text-[10px] text-neon-pink font-mono select-none">
                            x{block.loopCount}
                          </span>
                        </div>

                        <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Layers className="w-3 h-3 text-zinc-500" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateBlock(block.id);
                            }}
                            className="text-zinc-400 hover:text-cyan-400"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    <button
                      onClick={() =>
                        addSequenceBlock({
                          id: `sb_${Date.now()}`,
                          name: "New Section",
                          loopCount: 1,
                        })
                      }
                      className="flex-shrink-0 w-16 h-16 bg-zinc-900 border border-zinc-800 border-dashed rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 snap-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-[9px] font-mono tracking-widest text-zinc-500 text-center uppercase">
                    Tap to set loops (0-9). Drag to Reorder
                  </div>
                </Tabs.Content>

                {/* EXPERT AI TAB */}
                <Tabs.Content
                  value="expert"
                  className="flex-1 flex flex-col outline-none gap-2 overflow-hidden h-full"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="text-green-400">Abacus DeepAgent</span>
                    <button
                      onClick={handleAbacusSync}
                      className="flex items-center gap-1 hover:text-red-400 text-red-500/80"
                    >
                      <BrainCircuit className="w-3 h-3" /> Sync KB
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2 pr-1 hide-scrollbar">
                    {expertChat.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`p-2 rounded-xl max-w-[85%] text-xs font-sans leading-relaxed ${
                            msg.role === "user"
                              ? "bg-cyan-900/50 text-cyan-100 rounded-br-sm"
                              : "bg-zinc-800 text-zinc-300 rounded-bl-sm border border-zinc-700"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex bg-zinc-900 border border-zinc-800 rounded-full p-1 mt-auto shrink-0">
                    <input
                      value={expertInput}
                      onChange={(e) => setExpertInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleExpertSend()}
                      type="text"
                      placeholder="Ask Producer Agent..."
                      className="bg-transparent border-none outline-none text-xs font-sans flex-1 px-3 text-zinc-100 placeholder:text-zinc-600 focus:ring-0"
                    />
                    <button
                      onClick={handleExpertSend}
                      className="bg-zinc-800 text-green-400 p-1.5 hover:bg-green-900/30 rounded-full transition-colors mr-1"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </Tabs.Content>

                {/* GUARDIAN TAB */}
                <Tabs.Content
                  value="guardian"
                  className="flex-1 flex flex-col outline-none gap-3"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="text-blue-400">Policy & Telemetry</span>
                  </div>

                  <div className="flex-1 overflow-y-auto bg-zinc-900/50 border border-zinc-800 rounded p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-zinc-300">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                      <div className="text-sm font-sans flex-1">
                        <span className="block font-bold">Content Filter</span>
                        <span className="text-xs text-zinc-500">
                          Audio validation passed
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-300">
                      <Activity className="w-5 h-5 text-blue-400" />
                      <div className="text-sm font-sans flex-1">
                        <span className="block font-bold">Telemetry</span>
                        <span className="text-xs text-zinc-500">
                          Observational logging active
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAudit}
                    className="mt-auto w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold rounded flex justify-center items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Run Full Audit
                  </button>
                </Tabs.Content>

                {/* 3D VAULT TAB */}
                <Tabs.Content
                  value="3dvault"
                  className="flex-1 flex flex-col outline-none gap-3"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="text-indigo-400">
                      Obsidian 3D Knowledge Space
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded relative group">
                    <div className="absolute inset-0 pointer-events-auto">
                      <VaultGraph3D />
                    </div>
                    <div className="absolute inset-x-2 bottom-3 flex flex-col gap-2 pointer-events-none">
                      <div className="flex items-center gap-2 bg-zinc-950/80 backdrop-blur border border-zinc-800 p-2 rounded text-xs text-zinc-300 font-sans shadow-lg">
                        <Database className="w-4 h-4 text-indigo-400" />
                        <div className="flex-1">
                          <span className="block font-bold">
                            {kgData
                              ? "Vault Synced"
                              : "Local Vault Interactive (Offline)"}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {kgData
                              ? `Loaded ${kgData?.nodes?.length || 0} nodes and ${kgData?.edges?.length || 0} edges`
                              : "Displaying procedural graph representation"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleVaultSync}
                    className="mt-auto w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold rounded flex justify-center items-center gap-2 transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                  >
                    <Cloud className="w-4 h-4" />
                    Sync Vault to Render
                  </button>
                </Tabs.Content>

                {/* CONTEXT TAB */}
                <Tabs.Content
                  value="context"
                  className="flex-1 flex flex-col outline-none gap-3 overflow-y-auto hide-scrollbar"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span className="text-amber-400">
                      Personal Context & Modulation
                    </span>
                  </div>

                  {/* Knowledge Graph Integrations */}
                  <div className="flex flex-col gap-2">
                    <div className="bg-zinc-900/50 p-2 border border-zinc-800 rounded flex gap-2 items-center">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-cyan-400 font-mono tracking-wider font-bold">
                          USER KNOWLEDGE GRAPH (UKG)
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          Syncing Chat History + Extracted Preferences
                        </span>
                      </div>
                    </div>
                    <div className="bg-zinc-900/50 p-2 border border-zinc-800 rounded flex gap-2 items-center">
                      <Database className="w-4 h-4 text-green-400" />
                      <div className="flex flex-col">
                        <span className="text-[10px] text-green-400 font-mono tracking-wider font-bold">
                          AGENT KNOWLEDGE GRAPH (AKG)
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">
                          Syncing Agent Capabilites + Learnings
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* External integrations */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() =>
                        addLog(
                          "oauth: Initiating Spotify / Apple Music handshake...",
                        )
                      }
                      className="flex items-center gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg hover:border-green-500/50 transition-colors"
                    >
                      <Music className="w-5 h-5 text-green-500" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-zinc-200">
                          Connect Music Library
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Capture playlists & listening history
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        addLog("oauth: Initiating Google Photos handshake...")
                      }
                      className="flex items-center gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-lg hover:border-blue-500/50 transition-colors"
                    >
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-zinc-200">
                          Connect Photo Album
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Analyze media for generation context
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Voice Modulation Editing */}
                  <div className="mt-2 bg-zinc-900/50 p-3 border border-zinc-800 rounded-lg flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <SlidersHorizontal className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Voice Clone Modulator
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Pitch Shift</span>
                        <span>{voiceMod.pitch.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={voiceMod.pitch}
                        onChange={(e) =>
                          setVoiceMod({
                            ...voiceMod,
                            pitch: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span>Formant (Timbre)</span>
                        <span>{voiceMod.formant.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={voiceMod.formant}
                        onChange={(e) =>
                          setVoiceMod({
                            ...voiceMod,
                            formant: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-amber-600 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </Tabs.Content>
              </Tabs.Root>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <PipPlayer />
    </div>
  );
}
