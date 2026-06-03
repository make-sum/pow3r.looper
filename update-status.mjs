import fs from "fs";

let text = fs.readFileSync("src/store/useWorkflowStore.ts", "utf8");
text = text.replace(/status: "healthy"/g, 'status: "not-started"');
fs.writeFileSync("src/store/useWorkflowStore.ts", text, "utf8");
console.log("Updated status");
