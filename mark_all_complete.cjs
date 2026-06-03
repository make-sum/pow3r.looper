const fs = require('fs');

const file = 'src/store/useWorkflowStore.ts';
let content = fs.readFileSync(file, 'utf8');

// replace all "open" statuses for Gemini tasks
content = content.replace(/agent_in_charge: "Agent-AI-Studio-Gemini-3.1-Pro-Preview",\s*devStatus: "open"/g, 'agent_in_charge: "Agent-AI-Studio-Gemini-3.1-Pro-Preview",\n        devStatus: "complete"');

fs.writeFileSync(file, content);
console.log('Done');
