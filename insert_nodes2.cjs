const fs = require('fs');

const inFile = './src/store/useWorkflowStore.ts';
let code = fs.readFileSync(inFile, 'utf8');

const injected = JSON.parse(fs.readFileSync('./nodes_edges.txt', 'utf8'));

// find where initialNodes ends
const nodesEndIdx = code.indexOf('const initialEdges: Edge[] = [');

if (nodesEndIdx > -1) {
  // insert before the closing bracket of initialNodes
  const lastBracketOfNodes = code.lastIndexOf('];', nodesEndIdx);
  if (lastBracketOfNodes > -1) {
    code = code.slice(0, lastBracketOfNodes) + "," + injected.nodes + "\n" + code.slice(lastBracketOfNodes);
  }
}

fs.writeFileSync(inFile, code);
console.log("Nodes Injected.");
