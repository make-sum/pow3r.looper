import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set as setIDB, del } from 'idb-keyval';
import { Pow3rResponsePayload } from "../services/unifiedSchema";

export interface SongContextData {
  location?: { lat: number; lng: number; semantic: string };
  movementType?: "stationary" | "walking" | "running" | "driving" | "unknown";
  timeOfDay?: string;
  recentMusic?: string[];
  recentPhotosAnalyzed?: number;
  activeNotifications?: string[];
}

export interface SlideSequenceBlock {
  id: string;
  name: string;
  loopCount: number; // 0-9
  mediaRef?: string; // Image or Video ID
  promptContext?: string;
  volume?: number;
  fx?: string[];
  metadata?: any;
}

interface AppState {
  // Navigation
  currentVerticalIndex: number;
  currentHorizontalIndex: number; // -1: Left, 0: Center, 1: Right
  verticalDirection: number;
  setNavigation: (v: number, h: number, dir?: number) => void;
  hasExecutedRuntime: boolean;
  setHasExecutedRuntime: (val: boolean) => void;

  // Playback
  globalBpm: number;
  setGlobalBpm: (val: number) => void;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  isPipOpen: boolean;
  setIsPipOpen: (val: boolean) => void;
  playhead: number;
  setPlayhead: (updater: number | ((prev: number) => number)) => void;

  // Context
  songContext: SongContextData;
  updateSongContext: (data: Partial<SongContextData>) => void;

  // Knowledge Graphs
  agentKnowledgeGraph: any | null;
  temporalKnowledgeGraph: any | null;
  setAgentKnowledgeGraph: (kg: any) => void;
  setTemporalKnowledgeGraph: (kg: any) => void;

  // Slide Sequence
  sequenceBlocks: SlideSequenceBlock[];
  addSequenceBlock: (block: SlideSequenceBlock) => void;
  updateSequenceBlock: (
    id: string,
    updates: Partial<SlideSequenceBlock>,
  ) => void;
  reorderSequenceBlocks: (startIndex: number, endIndex: number) => void;

  // Media Cache
  mediaCache: Record<string, string>;
  setMediaCache: (key: string, url: string) => void;

  // Unified Logging (for UI rendering)
  systemLogs: Array<{
    id: string;
    message: string;
    level: string;
    timestamp: number;
  }>;
  appendLogsFromPayload: (payload: Pow3rResponsePayload) => void;
  addSystemLog: (message: string, level?: string) => void;
  expertChat: Array<{ id: string; role: string; text?: string; message?: string }>;
  addExpertChat: (msg: { id?: string; role: string; text?: string; message?: string }) => void;
  updateExpertChat: (id: string, text: string) => void;
  agents: { id: string; name: string; role: string; model: string; status: "idle" | "active" }[];
  addAgent: (agent: { id: string; name: string; role: string; model: string; status: "idle" | "active" }) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentVerticalIndex: -6,
      currentHorizontalIndex: 0,
      verticalDirection: 1,
      hasExecutedRuntime: false,
      setHasExecutedRuntime: (val) => set({ hasExecutedRuntime: val }),
      setNavigation: (v, h, dir) =>
        set((state) => ({ 
          currentVerticalIndex: v, 
          currentHorizontalIndex: h,
          verticalDirection: dir !== undefined ? dir : (v > state.currentVerticalIndex ? 1 : -1)
        })),

      globalBpm: 120,
  setGlobalBpm: (bpm) => set({ globalBpm: bpm }),
  isPlaying: false,

      setIsPlaying: (val) => set({ isPlaying: val }),
      isPipOpen: false,
      setIsPipOpen: (val) => set({ isPipOpen: val }),
      playhead: 0,
      setPlayhead: (updater) =>
        set((state) => ({
          playhead: typeof updater === "function" ? updater(state.playhead) : updater,
        })),

      songContext: {},
      updateSongContext: (data) =>
        set((state) => ({ songContext: { ...state.songContext, ...data } })),

      agentKnowledgeGraph: null,
      temporalKnowledgeGraph: null,
      setAgentKnowledgeGraph: (kg) => set({ agentKnowledgeGraph: kg }),
      setTemporalKnowledgeGraph: (kg) => set({ temporalKnowledgeGraph: kg }),

      sequenceBlocks: [
        { id: "sb_1", name: "Intro Base", loopCount: 2 },
        { id: "sb_2", name: "Verse Alpha", loopCount: 4 },
      ],
      addSequenceBlock: (block) =>
        set((state) => ({ sequenceBlocks: [...state.sequenceBlocks, block] })),
      updateSequenceBlock: (id, updates) =>
        set((state) => ({
          sequenceBlocks: state.sequenceBlocks.map((b) =>
            b.id === id ? { ...b, ...updates } : b,
          ),
        })),
      reorderSequenceBlocks: (startIndex, endIndex) =>
        set((state) => {
          const result = Array.from(state.sequenceBlocks);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { sequenceBlocks: result };
        }),

      mediaCache: {},
      setMediaCache: (key, url) => set((state) => ({ mediaCache: { ...state.mediaCache, [key]: url } })),

      systemLogs: [],
      addSystemLog: (message: string, level: string = "info") =>
        set((state) => ({
          systemLogs: [
            {
              id: Math.random().toString(36).substring(2),
              message,
              level,
              timestamp: Date.now(),
            },
            ...state.systemLogs,
          ].slice(0, 50),
        })),
      appendLogsFromPayload: (payload) =>
        set((state) => {
          const parsedLogs = payload.logs.map((l) => ({
            id: Math.random().toString(36).substring(2),
            message: `[${payload.action}] ${l.message}`,
            level: l.level,
            timestamp: l.timestamp,
          }));
          return { systemLogs: [...parsedLogs, ...state.systemLogs].slice(0, 50) };
        }),

      expertChat: [
        {
          id: "1",
          role: "assistant",
          text: "Hey, I form the rhythm. Try using a 4-on-the-floor kick pattern here.",
        },
      ],
      addExpertChat: (msg) =>
        set((state) => ({
          expertChat: [
            ...state.expertChat,
            { ...msg, id: msg.id || Math.random().toString(36).substring(2) },
          ].slice(-50),
        })),
      updateExpertChat: (id, text) =>
        set((state) => ({
          expertChat: state.expertChat.map((msg) =>
            msg.id === id ? { ...msg, text } : msg
          ),
        })),
        
      agents: [
        { id: "agent-1", name: "Agent Alpha", role: "Coder / Logic", model: "Gemini-3.1-Pro", status: "idle" },
        { id: "agent-2", name: "Agent Bravo", role: "Visual Reviewer", model: "Veo Vision", status: "idle" }
      ],
      addAgent: (agent) => set((state) => ({ agents: [...state.agents, agent] })),
    }),
    {
      name: "pow3r-app-store",
      storage: createJSONStorage(() => ({
        getItem: async (name: string): Promise<string | null> => {
          return (await get(name)) || null;
        },
        setItem: async (name: string, value: string): Promise<void> => {
          await setIDB(name, value);
        },
        removeItem: async (name: string): Promise<void> => {
          await del(name);
        },
      })),
      partialize: (state) => ({ 
        expertChat: state.expertChat,
        mediaCache: state.mediaCache,
        sequenceBlocks: state.sequenceBlocks
      }),
    }
  )
);
