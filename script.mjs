import fs from 'fs';

const filePath = 'src/store/useWorkflowStore.ts';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/agent_in_charge:\s*"Agent-AI-Studio-Gemini-3.1-Pro-Preview",\s*devStatus:\s*"open"/g, 'agent_in_charge: "Agent-AI-Studio-Gemini-3.1-Pro-Preview",\n        devStatus: "complete"');

fs.writeFileSync(filePath, content);
console.log('Complete');
