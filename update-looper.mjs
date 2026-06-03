import fs from "fs";

let text = fs.readFileSync("src/store/useWorkflowStore.ts", "utf8");

text = text.replace(
  /id: "node-builder-loop-player",[\s\S]*?goal: "([^"]+)",/m,
  `id: "node-builder-loop-player",
      type: "ui.builder",
      name: "[BUILDER] Loop Runtime",
      status: "not-started",
      capabilities: ["builder_plan"],
      plan: {
        goal: "Implement realistic Loop Player UI with sequence tracks, playhead synchronization, and telemetry tracing. The AI updated XMAP Plan Sync policy directly to fix structural gaps as requested.",`
);

fs.writeFileSync("src/store/useWorkflowStore.ts", text, "utf8");
console.log("Updated loop player plan context");
