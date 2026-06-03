import fs from 'fs';
import path from 'path';

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('process.env.GEMINI_API_KEY')) {
    content = content.replace(/process\.env\.GEMINI_API_KEY/g, 'import.meta.env.VITE_GEMINI_API_KEY || "dummy"');
    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  }
}
