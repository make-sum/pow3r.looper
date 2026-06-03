import fs from "fs";

let text = fs.readFileSync("src/store/useWorkflowStore.ts", "utf8");

text = text.replace(/engineeringSize: ".*",/g, '$&\n        agent_in_charge: "Agent-AI-Studio-Gemini-3.1-Pro-Preview",');

fs.writeFileSync("src/store/useWorkflowStore.ts", text, "utf8");
