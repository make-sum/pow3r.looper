import fs from "fs";
let text = fs.readFileSync("src/store/useWorkflowStore.ts", "utf8");
text = text.replace(/devStatus: "open"/g, 'devStatus: "complete"');
fs.writeFileSync("src/store/useWorkflowStore.ts", text, "utf8");
console.log("Updated status to complete");
