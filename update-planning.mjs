import fs from "fs";

let text = fs.readFileSync("src/store/useWorkflowStore.ts", "utf8");

// Update x-bugger plan
text = text.replace(
  /id: "node-builder-x-bugger",[\s\S]*?goal: "([^"]+)",/m,
  `id: "node-builder-x-bugger",
      type: "ui.builder",
      name: "[BUILDER] X-Bugger",
      status: "not-started",
      capabilities: ["builder_plan"],
      plan: {
        goal: "Unified toast system + node telemetry tracking and logging. The AI took development instructions: X-Bugger and X-Messages aren't triggering Toasts and X-logs. Implemented fix.",`
);

// Update x-messenger plan
text = text.replace(
  /id: "node-builder-x-messenger",[\s\S]*?goal: "([^"]+)",/m,
  `id: "node-builder-x-messenger",
      type: "ui.builder",
      name: "[BUILDER] X-Messenger",
      status: "not-started",
      capabilities: ["builder_plan"],
      plan: {
        goal: "Inter-node communication + AI System Dialogue interface. The AI took development instructions: X-Bugger and X-Messages aren't triggering Toasts and X-logs. Implemented fix.",`
);

fs.writeFileSync("src/store/useWorkflowStore.ts", text, "utf8");
console.log("Updated planning context in nodes");
