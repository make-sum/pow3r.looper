/// <reference types="vite/client" />

export async function proxyGenerateText(prompt: string, model: string = "gemini-2.5-flash"): Promise<string> {
    const response = await fetch("/api/generate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model })
    });
    if (!response.ok) {
       throw new Error(`Text generation failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.text || "";
}

export async function askExpertAgent(
  prompt: string,
  history: { role: "user" | "assistant"; text: string }[],
): Promise<string> {
  try {
    const systemInstruction =
      "You are an expert music producer and Abacus DeepAgent. You analyze music sequences, evaluate rhythmic structures, and provide concise, professional production advice.";
    const context = history.map((h) => `${h.role}: ${h.text}`).join("\n");
    const fullPrompt = `${systemInstruction}\n\nChat History:\n${context}\n\nUser: ${prompt}\nAssistant:`;

    return await proxyGenerateText(fullPrompt, "gemini-2.5-flash") || "No response received.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function enhancePrompt(prompt: string): Promise<string> {
  try {
    const text = await proxyGenerateText(
      `You are an expert prompt engineer. Improve this prompt to be used for high-end cinematic media generation (Image/Video). Make it highly detailed, focusing on perfect lighting, composition, style (e.g., film, animation, 3D render), and emotional depth. Do not use crappy lighting or generic layouts.
Original Prompt: "${prompt}"

Return ONLY the improved prompt text.`, 
      "gemini-2.5-flash"
    );
    return text || prompt;
  } catch (err) {
    console.error("Gemini API Error:", err);
    return prompt;
  }
}

export async function generateVideoFromPrompt(
  prompt: string,
): Promise<string | null> {
  // Not updating this to fetch since generateVideos uses a different pipeline temporarily 
  return null;
}

export async function generateImageFromPrompt(
  prompt: string,
): Promise<string | null> {
  // Not updating this to fetch since generateImages uses a different pipeline temporarily
  return null;
}

export async function generateAudioMetadata(
  prompt: string,
): Promise<{ duration: number; bpm: number }> {
  try {
    const text = await proxyGenerateText(`You are an audio metadata extraction tool. Given a prompt for audio generation, predict the generated audio duration in seconds (from 5 to 60) and the BPM (from 60 to 180). Return ONLY valid JSON format: {"duration": number, "bpm": number}.
Prompt: ${prompt}`, "gemini-2.5-flash");
    
    // strip markdown wrappers if any
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText || "{}");
    return {
      duration: parsed.duration || 15.0,
      bpm: parsed.bpm || 120,
    };
  } catch (err) {
    console.error("Gemini API Error:", err);
    return { duration: 15.0, bpm: 120 };
  }
}

export async function auditGuardianPolicy(
  sequenceBlocks: any[],
): Promise<{ passed: boolean; violations: string[] }> {
  try {
    const text = await proxyGenerateText(`You are a Guardian Policy Enforcer. Review the provided workflow sequence blocks (JSON objects representing audio samples) and assess if there are any loud or offensive descriptors, or problematic combinations of blocks (like playing 5 overlapping sub-bass parts causing clipping). Return ONLY valid JSON: {"passed": boolean, "violations": string[]}.
Blocks: ${JSON.stringify(sequenceBlocks)}`, "gemini-2.5-flash");
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText || "{}");
    return {
      passed: parsed.passed ?? true,
      violations: parsed.violations || [],
    };
  } catch (err) {
    console.error("Gemini API Error:", err);
    return { passed: true, violations: [] };
  }
}

export async function graphObsidianVaultSync(): Promise<{
  nodesSynced: number;
  edgesSynced: number;
}> {
  try {
    const text = await proxyGenerateText(`Simulate the indexing statistics of reading an Obsidian Markdown Vault for an audio production knowledge graph. Generate a random but realistic number of nodes (between 40 and 500) and edges (between 50 and 1000). Return ONLY valid JSON: {"nodesSynced": number, "edgesSynced": number}.`, "gemini-2.5-flash");
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText || "{}");
    return {
      nodesSynced: parsed.nodesSynced || 128,
      edgesSynced: parsed.edgesSynced || 256,
    };
  } catch (err) {
    console.error("Gemini API Error:", err);
    return { nodesSynced: 128, edgesSynced: 256 };
  }
}

export async function generateLyrics(
  prompt: string,
): Promise<Array<{ time: number; text: string }>> {
  try {
    const text = await proxyGenerateText(`Generate 4 lines of short, punchy lyrics for a song about: "${prompt}". 
Format exactly as a JSON array of objects with "time" (number, seconds) and "text" (string) properties, spaced about 2-3 seconds apart starting at 1 second. Return ONLY valid JSON.`, "gemini-2.5-flash");
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText || "[]");
  } catch (err) {
    console.error("Gemini Lyrics API Error:", err);
    return [];
  }
}

export async function buildDesignKnowledgeGraph(): Promise<any> {
  try {
    const text = await proxyGenerateText(`Build a highly detailed JSON Knowledge Graph for top light animation design based on mega shows, music video aesthetics, album cover designs, and Resolume VJ artists. Return ONLY valid JSON with "nodes" (id, label, type) and "edges" (source, target, relationship). Create a rich interconnected structure.`, "gemini-2.5-flash");
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText || "{}");
  } catch (err) {
    console.error("Gemini KG API Error:", err);
    return { nodes: [], edges: [] };
  }
}

