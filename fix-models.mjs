import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let newContent = content.replace(/gemini-3\.1-flash-preview/g, 'gemini-2.5-flash');
    newContent = newContent.replace(/gemini-3\.1-flash-lite-preview/g, 'gemini-2.5-flash');
    
    // In server.ts we also have gemini-3.1-flash-tts-preview
    // Let's change it to gemini-2.0-flash-tts or similar? wait, model name for TTS is probably gemini-2.0-flash-exp or similar.
    // Actually, TTS model is usually gemini-2.5-flash? No TTS is typically not available through standard generation, wait, the "responseModalities: [Modality.AUDIO]" works with gemini-2.5-flash. So we can just use gemini-2.5-flash for TTS as well.
    newContent = newContent.replace(/gemini-3\.1-flash-tts-preview/g, 'gemini-2.5-flash');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log('Fixed', filePath);
    }
}

const files = [
    'src/components/SfxGen.tsx',
    'src/components/Midi.tsx',
    'src/components/ImageGen.tsx',
    'src/components/SamplerEditor.tsx',
    'src/services/geminiService.ts',
    'src/services/abacusWebSocketService.ts',
    'server.ts'
];

files.forEach(f => replaceInFile(path.join(process.cwd(), f)));
