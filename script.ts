import { MATRIX_SCHEMA } from "./src/config/matrixSchema";
import * as fs from "fs";

let newNodes = "";
let newEdges = "";
let i = 2500;
let j = 200;

for (const vIndex of Object.keys(MATRIX_SCHEMA)) {
  const row = MATRIX_SCHEMA[parseInt(vIndex)];
  
  if (!row) continue;
  
  for (const hIndex of Object.keys(row.panels)) {
    const pIndex = parseInt(hIndex);
    const panel = row.panels[pIndex];
    if (!panel) continue;
    
    // We create a node ID based on row and panel
    const nodeId = `node-view-${row.id}-${pIndex}`;
    
    // Check if this node is already in the file... we'll just generate them all
    // and let the file replace later. Wait, we want to just append to the list.
    newNodes += `
  {
    id: "${nodeId}",
    type: "ui.panel",
    position: { x: ${1500 + pIndex * 300}, y: ${i} },
    data: {
      id: "${nodeId}",
      type: "ui.panel",
      name: "${panel.title}",
      status: "idle",
      capabilities: ["view", "${panel.type}"],
      plan: {
        goal: "Implement ${panel.title} view for ${row.title}",
        date: "2026-05-13",
        versionId: "v9.0.1",
        planId: "PLAN-VIEW-${row.id}-${pIndex}",
        taskId: "TASK-BUILD-VIEW",
        engineeringSize: "md",
        agent_in_charge: "Agent-AI-Studio-Gemini-3.1-Pro-Preview",
        devStatus: "open",
        goalSuccessRequirement: "UI panel is fully mapped and interactable.",
      }
    },
  },`;
    
    newEdges += `
  {
    id: "edge-panel-${row.id}-${pIndex}",
    source: "node-user-journey-nav",
    target: "${nodeId}",
    type: "smoothstep",
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 1 },
  },`;
  }
  i += 200;
}

const outFile = "nodes_edges.txt";
fs.writeFileSync(outFile, JSON.stringify({nodes: newNodes, edges: newEdges}));
console.log("Done");
