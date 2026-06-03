const fs = require('fs');

const file = 'src/store/useWorkflowStore.ts';
let content = fs.readFileSync(file, 'utf8');

const tasks = ['TASK-REC', 'TASK-TRACKING', 'TASK-SCAN'];
tasks.forEach(task => {
  const regex = new RegExp(`(taskId: "${task}",\\s*engineeringSize: "[^"]+",\\s*agent_in_charge: "Agent-AI-Studio-Gemini-3.1-Pro-Preview",\\s*devStatus: )"open"`, 'g');
  content = content.replace(regex, '$1"complete"');
});

fs.writeFileSync(file, content);
console.log('Updated tasks');
