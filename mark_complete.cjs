const fs = require("fs");

const inFile = "./src/store/useWorkflowStore.ts";
let code = fs.readFileSync(inFile, "utf8");

function markComplete(taskId) {
  const matchStr = `taskId: "${taskId}",`;
  const idx = code.indexOf(matchStr);
  if (idx === -1) {
    console.log("Could not find ", taskId);
    return;
  }
  
  const devStatusIdx = code.indexOf('devStatus: "open"', idx);
  if (devStatusIdx !== -1 && devStatusIdx < idx + 300) {
    code = code.substring(0, devStatusIdx) + 'devStatus: "complete"' + code.substring(devStatusIdx + 17);
    console.log("Marked " + taskId + " complete");
  } else {
    console.log("Could not find devStatus: 'open' near", taskId);
  }
}

markComplete("TASK-BUILD-LOOP");
markComplete("TASK-BUILD-GEN-LAYER");
markComplete("TASK-BUILD-LOOP-FX");

fs.writeFileSync(inFile, code);
console.log("Done");
