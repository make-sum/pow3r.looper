import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content;

    // Fix .text access
    // Look for lines assigning `.text` from a promise or variable that's already a string
    // e.g., `const plan = JSON.parse(response.text.replace(...))`
    // or `const text = await proxyGenerateText(...); const foo = JSON.parse(text.text)`
    // Many places might be doing: `const response = await proxyGenerateText(...)` and then `response.text`.
    // I can replace `response.text` with `response` if it comes from proxyGenerateText.
    if (content.includes("proxyGenerateText")) {
       // Since proxyGenerateText returns a string, 'response.text' should be 'response'
       // But what if the variable is named something else? Let's just blindly globally replace:
       // If there's `const response = await proxyGenerateText` we know `response` is a string
       // Wait, I can just do a regex!
       
       newContent = newContent.replace(/([a-zA-Z0-9_]+)\s*=\s*await proxyGenerateText\([^)]+\)[\s\S]*?(?=\s*(const|let|var|return|if|\}))/g, (match, varName) => {
           // We found where a variable is assigned from proxyGenerateText
           return match; // But regex is hard, maybe just replace `response.text` with `response` if `proxyGenerateText` is in the file?
       });
       
       // Actually, let's just replace `.text.replace` with `.replace` in these files, assuming it's `response.text.replace`
       newContent = newContent.replace(/response\.text\.replace/g, 'response.replace');
       newContent = newContent.replace(/response\.text \|\|/g, 'response ||');
       newContent = newContent.replace(/JSON\.parse\(response\.text\)/g, 'JSON.parse(response)');
       // Sometimes it's `aiResponse.text`
       newContent = newContent.replace(/aiResponse\.text/g, 'aiResponse');
    }
    
    // For VideoGen, add back GoogleGenAI
    if (filePath.endsWith('VideoGen.tsx')) {
        if (!newContent.includes('const ai = new GoogleGenAI')) {
           newContent = newContent.replace(/let operation = await ai\.models\.generateVideos/g, `const { GoogleGenAI } = await import("@google/genai");\n      const apiKey = (import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY) as string;\n      const ai = new GoogleGenAI({ apiKey });\n      let operation = await ai.models.generateVideos`);
        }
    }
    
    // For SamplerEditor, remove onerror assignment to OfflineAudioContext because Safari doesn't have it in types ? Wait, the linter says it doesn't exist on OfflineAudioContext. Wait, onerror exists but only in some TS types. I can do `(offlineCtx as any).onerror = reject;`
    if (filePath.endsWith('SamplerEditor.tsx')) {
        newContent = newContent.replace(/offlineCtx\.onerror = reject;/g, '(offlineCtx as any).onerror = reject;');
    }
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log('Fixed', filePath);
    }
}

const files = [
    'src/components/AgentGen.tsx',
    'src/components/Amca.tsx',
    'src/components/DanceGen.tsx',
    'src/components/Hologram.tsx',
    'src/components/KinetixGen.tsx',
    'src/components/LightGen.tsx',
    'src/components/LoopPlayer.tsx',
    'src/components/MusicGen.tsx',
    'src/components/ProjectionMapper.tsx',
    'src/components/SamplerEditor.tsx',
    'src/components/SchemaSidebar.tsx',
    'src/components/SparkFingerprinting.tsx',
    'src/components/SurfaceScanner.tsx',
    'src/components/VideoGen.tsx',
    'src/components/VideoTracking.tsx',
    'src/components/Vmca.tsx'
];

files.forEach(f => fixFile(path.join(process.cwd(), f)));
