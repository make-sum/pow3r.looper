import { buildPow3rRequest, executePow3rWorkflow } from "./unifiedSchema";

// Utilizes Cloudflare KV and Vectorize interfaces for the Edge Agent interactions
export class EdgeRAGAgent {
  private kvStore = new Map<string, any[]>();
  private userKnowledgeGraph = new Map<string, any>(); // UKG
  private agentKnowledgeGraph = new Map<string, any>(); // AKG
  private mediaKnowledgeGraph = new Map<string, any>(); // MKG

  constructor() {
    // Initial UKG
    this.userKnowledgeGraph.set("default_user", {
      preferences: {
        dark_mode: true,
        interface_style: "expert",
      },
      aesthetics: {
        music_style: "cyberpunk_synthwave",
        visual_style: "neon_noir",
        prompt_style: "direct_and_technical",
      },
      context: {
        recent_locations: ["Studio A", "Main Stage"],
        notifications: ["Render Complete", "Agent finished code generation"],
        active_project: "Zero_G_Environment",
      },
    });

    // Initial AKG
    this.agentKnowledgeGraph.set("sys_agent", {
      capabilities: ["3JS generation", "Audio slicing", "Video compositing"],
      personality: "technical_co_creator",
      learnings: [
        "User prefers 120bpm for cyberpunk tracks",
        "Avoid emojis in logs according to system protocol",
        "User frequently requests heavy sub-bass",
      ],
    });
  }

  // KV Chat History
  async saveChatMessage(
    userId: string,
    targetAgentId: string,
    message: string,
    role: "user" | "agent",
  ) {
    const key = `chat:${userId}:${targetAgentId}`;
    if (!this.kvStore.has(key)) this.kvStore.set(key, []);
    const history = this.kvStore.get(key)!;
    history.push({ role, message, timestamp: Date.now() });

    // Insight Extraction to UKG -> Vectorize
    if (role === "user") {
      await this.vectorizeUserInsights(userId, message);
    }
  }

  getChatHistory(userId: string, targetAgentId: string) {
    return this.kvStore.get(`chat:${userId}:${targetAgentId}`) || [];
  }

  // Vectorization Simulator
  private async vectorizeUserInsights(userId: string, message: string) {
    const request = buildPow3rRequest("UPDATE_KNOWLEDGE_GRAPH", {
      userId,
      message,
    });
    await executePow3rWorkflow(request, async () => {
      // Simulate LLM extracting preferences from prompt
      const ukg = this.userKnowledgeGraph.get(userId) || {
        aesthetics: {},
        preferences: {},
        context: {},
      };

      if (
        message.toLowerCase().includes("heavy") ||
        message.toLowerCase().includes("bass")
      ) {
        ukg.aesthetics.music_style = "heavy_bass_centric";
      }
      if (message.toLowerCase().includes("cyberpunk")) {
        ukg.aesthetics.visual_style = "cyberpunk";
      }

      this.userKnowledgeGraph.set(userId, ukg);
      return { success: true, graph_updated: "UKG" };
    });
  }

  // Rag Sync
  async ragQuery(userId: string, query: string) {
    const ukg = this.userKnowledgeGraph.get(userId);
    const akg = this.agentKnowledgeGraph.get("sys_agent");
    const mkg = this.mediaKnowledgeGraph.get("recent_media") || {};

    // Return unified context
    return {
      user_context: ukg,
      agent_context: akg,
      media_context: mkg,
      vector_similarity: 0.94,
    };
  }
}

export const edgeAgent = new EdgeRAGAgent();
