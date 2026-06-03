const fs=require("fs");
let c=fs.readFileSync("src/components/SurfaceView.tsx","utf8");

const start = c.indexOf("const handleExpertSend = async () => {");
const end = c.indexOf("  const handleAbacusSync = async () => {", start);

if (start === -1 || end === -1) {
  console.log("Could not find boundaries");
  process.exit(1);
}

const replacement = `  const handleExpertSend = async () => {
    if (!expertInput.trim()) return;
    const promptText = expertInput;
    const userMsgId = Date.now().toString();
    const assistantMsgId = (Date.now() + 1).toString();

    setExpertChat((prev) => [
      ...prev,
      { id: userMsgId, role: "user" as const, text: promptText },
      { id: assistantMsgId, role: "assistant" as const, text: "..." },
    ]);
    setExpertInput("");

    await edgeAgent.saveChatMessage(
      "contact@medialocal.com",
      "sys_agent",
      promptText,
      "user",
    );

    addLog(\`sys: Querying UKG / AKG via AI Gateway...\`);
    const ragContext = await edgeAgent.ragQuery(
      "contact@medialocal.com",
      promptText,
    );
    addLog(\`sys: Vector Similarity Matches: \${ragContext.vector_similarity}\`);

    let agentResponseText = "";
    
    if (wsProxyRef.current) {
      wsProxyRef.current.onMessage((data) => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "chunk") {
            agentResponseText += parsed.content;
            setExpertChat((prev) => 
               prev.map(msg => msg.id === assistantMsgId ? { ...msg, text: agentResponseText } : msg)
            );
          } else if (parsed.type === "done") {
             edgeAgent.saveChatMessage(
              "contact@medialocal.com",
              "sys_agent",
              agentResponseText,
              "assistant",
            );
          }
        } catch(err) {}
      });
      wsProxyRef.current.sendMessage({ prompt: promptText, context: ragContext });
    } else {
      const request = buildPow3rRequest("AGENT_CHAT", {
        expertInput: promptText,
        newHistory: expertChat,
        ragContext,
      });
      const response = await executePow3rWorkflow(request, async (data) => {
        const gHistory = data.newHistory.map((m: any) => ({
          role: m.role as "user" | "assistant",
          text: m.text,
        }));
        return await askExpertAgent(data.expertInput, gHistory);
      });

      appendLogsFromPayload(response);

      if (response.status === "success" && response.data) {
        agentResponseText = response.data as string;
        setExpertChat((prev) => 
           prev.map(msg => msg.id === assistantMsgId ? { ...msg, text: agentResponseText } : msg)
        );
        await edgeAgent.saveChatMessage(
          "contact@medialocal.com",
          "sys_agent",
          agentResponseText,
          "assistant",
        );
      } else {
        addLog(\`error: \${response.error || "Unknown Chat Error"}\`);
      }
    }
  };

`;

const newCode = c.substring(0, start) + replacement + c.substring(end);
fs.writeFileSync("src/components/SurfaceView.tsx", newCode);
console.log("Replaced handleExpertSend");
