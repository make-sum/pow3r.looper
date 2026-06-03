const fs = require('fs');

const inFile = './src/store/useWorkflowStore.ts';
let code = fs.readFileSync(inFile, 'utf8');

const injected = JSON.parse(fs.readFileSync('./nodes_edges.txt', 'utf8'));

// find where initialNodes ends
// e.g. "export const initialNodes: Node[] = ["
const nodesEndIdx = code.indexOf('export const initialEdges: Edge[] = [');

if (nodesEndIdx > -1) {
  // insert before the closing bracket of initialNodes
  const lastBracketOfNodes = code.lastIndexOf('];', nodesEndIdx);
  if (lastBracketOfNodes > -1) {
    code = code.slice(0, lastBracketOfNodes) + "," + injected.nodes + "\n" + code.slice(lastBracketOfNodes);
  }
}

const edgesEndIdx = code.indexOf('export const useWorkflowStore');
if (edgesEndIdx > -1) {
  const lastBracketOfEdges = code.lastIndexOf('];', edgesEndIdx);
  if (lastBracketOfEdges > -1) {
    code = code.slice(0, lastBracketOfEdges) + "," + injected.edges + "\n" + code.slice(lastBracketOfEdges);
  }
}

fs.writeFileSync(inFile, code);
console.log("Injected.");
