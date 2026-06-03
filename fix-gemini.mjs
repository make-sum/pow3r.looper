import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src/components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  let modified = false;

  if (content.includes('new GoogleGenAI')) {
     if (!content.includes('proxyGenerateText')) {
        content = `import { proxyGenerateText } from "../services/geminiService";\n` + content;
     }

     content = content.replace(/import\s*\{\s*GoogleGenAI[^}]*\}\s*from\s*["']@google\/genai["'];\s*/g, '');
     content = content.replace(/const\s+ai\s*=\s*new\s+GoogleGenAI[^;]+;\s*/g, '');
     
     // Complex replacers are risky, but we can try to replace `ai.models.generateContent({ model: "gemini...", contents: ... })`
     // Wait, actually, let's look at the patterns.
     
     content = content.replace(/await ai\.models\.generateContent\(\{\s*model:\s*["'][^"']+["'],\s*contents:\s*(`[^`]+`|"[^"]+"|[^,}]+),?\s*\}\)/g, 'await proxyGenerateText($1)');
     
     modified = true;
  }

  if (modified) {
     fs.writeFileSync(filePath, content, 'utf-8');
     console.log('Modified', file);
  }
}
