import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route for Music Generation
  app.post("/api/generate-music", async (req, res) => {
    try {
      const { stylePrompt, lyricsPrompt, duration } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "Missing GEMINI_API_KEY" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Style: ${stylePrompt} | Lyrics: ${lyricsPrompt}. Duration target: ${duration}s`;
      
      const responseStream = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: prompt
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of responseStream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      res.json({
        success: true,
        audioBase64,
        lyrics,
        mimeType
      });

    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "Generation failed: " + e.message });
    }
  });

  // API Route for Text-to-Speech Generation
  app.post("/api/generate-tts", async (req, res) => {
    try {
      const { prompt, voiceName, stability = 50, clarity = 50 } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "Missing GEMINI_API_KEY" });
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const emotionalPrompt = `${prompt}\n[Note to Voice Actor (simulate via prosody): Read with ${(stability as number) > 75 ? 'extreme robotic/steady' : 'natural expressive'} stability and ${(clarity as number) > 75 ? 'hyper-articulated' : 'conversational'} clarity. (Stability: ${stability}%, Clarity: ${clarity}%)]`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: emotionalPrompt,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName || "Aoede" },
              },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || "audio/pcm";

      if (!base64Audio) {
         return res.status(500).json({ error: "No audio generated from the model" });
      }

      res.json({
        success: true,
        base64Audio,
        mimeType
      });

    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: "TTS Generation failed: " + e.message });
    }
  });

  // API Route for text generation
  app.post("/api/generate-text", async (req, res) => {
    try {
      const { prompt, model } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return res.status(401).json({ error: "Missing GEMINI_API_KEY" });

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateContent({
        model: model || "gemini-2.5-flash",
        contents: prompt
      });

      res.json({ success: true, text: response.text });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // API Route for Image Generation (Imagen 3)
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return res.status(401).json({ error: "Missing GEMINI_API_KEY" });

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt,
        config: {
          aspectRatio,
          numberOfImages: 1
        },
      });

      const base64EncodeString = response.generatedImages?.[0]?.image?.imageBytes;
      if (!base64EncodeString) {
        return res.status(500).json({ error: "No image was returned from the API." });
      }
      
      res.json({ success: true, base64: base64EncodeString });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
