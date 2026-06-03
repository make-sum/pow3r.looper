import { GoogleGenAI } from "@google/genai";
async function test() {
   const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
   const response = await ai.models.generateVideos({
      model: "veo-2.0-generate-001",
      prompt: "A beautiful sunset over the mountains",
      config: {
          personGeneration: "ALLOW_ADULT"
      }
   });
   console.log(response);
}
test().catch(console.error);
