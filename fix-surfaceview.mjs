import fs from "fs";

let text = fs.readFileSync("src/components/SurfaceView.tsx", "utf8");

// Remove local state definitions
text = text.replace(/const \[mcpLogs, setMcpLogs\] = useState[^\n]+;/g, "");
text = text.replace(/const \[expertChat, setExpertChat\] = useState\(\[\s*\{\s*id: "1",\s*role: "assistant",\s*text: "[^"]+",\s*\},\s*\]\);/msg, "");

text = text.replace(/const appendLogsFromPayload = useAppStore\(\n\s*\(state\) => state\.appendLogsFromPayload,\n\s*\);/m, 
`const appendLogsFromPayload = useAppStore((state) => state.appendLogsFromPayload);
  const mcpLogs = useAppStore((state) => state.systemLogs);
  const addSystemLog = useAppStore((state) => state.addSystemLog);
  const expertChat = useAppStore((state) => state.expertChat);
  const addExpertChat = useAppStore((state) => state.addExpertChat);`);

// Let's rewrite addLog to use addSystemLog.
text = text.replace(/const addLog = \(message: string\) => \{\n\s*setMcpLogs\(\(prev\) =>[\s\S]*?\.slice\([\s\S]*?\),\n\s*\);\n\s*\};/m,
`const addLog = (message: string) => {
    addSystemLog(message);
  };`);

// Rewrite setExpertChat calls
text = text.replace(/setExpertChat\(\(prev\) =>\s*\[\s*\.\.\.prev,\s*\{\s*id: (Math\.random\(\)\.toString\(36\)\.substring\(7\)|Math\.random\(\)\.toString\(\)),\s*role: "(user|assistant|system|sys_agent)",\s*text: (.*?),\s*\}(,)?\s*\]\.slice\(-25\),\s*\);/gs, 
  "addExpertChat({ role: '$2', text: $3 });");

text = text.replace(/setExpertChat\(\(prev\) =>\s*\[[\s\n]*\.\.\.prev,[\s\n]*\{[\s\n]*id: (Math\.random\(\)\.toString\(36\)\.substring\(7\)|Math\.random\(\)\.toString\(\)),[\s\n]*role: '(user|assistant|system|sys_agent)',[\s\n]*text: (.*?)[\s\n]*\}[\s\n]*\]\);/gs,
  "addExpertChat({ role: '$2', text: $3 });");

text = text.replace(/setExpertChat\(\(prev\) =>\s*\[[\s\n]*\.\.\.prev,[\s\n]*\{[\s\n]*id: (Math\.random\(\)\.toString\(36\)\.substring\(7\)|Math\.random\(\)\.toString\(\)),[\s\n]*role: "(user|assistant|system|sys_agent)",[\s\n]*text: (.*?)[\s\n]*\}[\s\n]*\]\);/gs,
  "addExpertChat({ role: '$2', text: $3 });");

text = text.replace(/setExpertChat\(\(prev\) =>\n\s*\[\n\s*\.\.\.prev,\n\s*\{\n\s*id: (Math\.random\(\)\.toString\(36\)\.substring\(7\)|Math\.random\(\)\.toString\(\)),\n\s*role: "(user|assistant|system|sys_agent)",\n\s*text:(.*?)\n\s*\}\n\s*\]\)/gm,
  "addExpertChat({ role: '$2', text: $3 })");


fs.writeFileSync("src/components/SurfaceView.tsx", text, "utf8");
console.log("Updated SurfaceView.tsx");
