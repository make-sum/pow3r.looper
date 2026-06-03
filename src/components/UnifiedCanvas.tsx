import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useWorkflowStore } from "../store/useWorkflowStore";
import { useAppStore } from "../store/appStore";
import { MATRIX_SCHEMA } from "../config/matrixSchema";
import { CoreNode, PlatformNode, UINode, BuilderNode } from "./CustomNodes";

import { DynamicEdge } from "./DynamicEdge";
import { toast } from "sonner";

const nodeTypes = {
  coreNode: CoreNode,
  platformNode: PlatformNode,
  uiNode: UINode,
  ui: UINode,
  "ui.panel": UINode,
  "ui.builder": BuilderNode,
};

const edgeTypes = {
  default: DynamicEdge,
  dynamic: DynamicEdge,
};

export default function UnifiedCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useWorkflowStore();
  const setNavigation = useAppStore((state) => state.setNavigation);
  const addSystemLog = useAppStore((state) => state.addSystemLog);
  const addExpertChat = useAppStore((state) => state.addExpertChat);

  const renderedEdges = edges.map((e) =>
    e.data?.isBuilderEdge ? { ...e, type: "dynamic", hidden: false } : { ...e, type: "dynamic" }
  );

  const handleEdgeClick = (event: React.MouseEvent, edge: any) => {
    toast.success(`Edge Triggered: ${edge.id}`, { description: `Invoking orchestrator payload across ${edge.source} -> ${edge.target}` });
    addSystemLog(`edge_execution: Payload sent across edge ${edge.id} [${edge.source} -> ${edge.target}]`, "info");
    addExpertChat({
      role: "system",
      text: `Workflow execution triggered on edge ${edge.id} for task routing.`,
    });
  };

  const handleNodeClick: NodeMouseHandler = (event, node) => {
    if (node.type === "ui.builder" || node.type === "uiNode") {
      const bIdMap: Record<string, string> = {
        "node-builder-music-gen": "music",
        "node-builder-mixer": "mixer",
        "node-builder-sequencer": "sequencer",
        "node-builder-loop-player": "loop_player",
        "node-builder-voice-gen": "voice",
        "node-builder-image-gen": "image",
        "node-builder-video-gen": "video",
        "node-builder-light-gen": "light",
        "node-builder-sfx-gen": "laser",
        "node-builder-agent-gen": "code",
        "node-builder-sampler-editor": "sampler",
        "node-builder-dance-gen": "dance",
        "node-builder-amca": "amca",
        "node-builder-vmca": "vmca",
        "node-builder-midi": "midi",
        "node-builder-spark-fingerprinting": "spark_fingerprinting",
        "node-builder-projection-mapper": "projection_mapper",
        "node-builder-hologram": "hologram",
        "node-builder-ar-presets": "ar_presets",
        "node-builder-mic-recorder": "mic_recorder",
        "node-builder-surface-scanner": "surface_scanner",
        "node-builder-video-tracking": "video_tracking",
        "node-builder-wf-builder": "wf_builder",
        "node-builder-x-bugger": "x_bugger",
        "node-builder-x-messenger": "x_messenger",
        "node-builder-component-factory": "component_factory",
        "node-builder-data-router": "data_router",
        "node-builder-stage-builder": "stage_builder",
        "node-builder-agent-sandbox": "agent_sandbox",
      };
      
      const mappedId = bIdMap[node.id] || node.id;
      const matrixEntry = Object.entries(MATRIX_SCHEMA).find(
        ([_, row]) => row.id === mappedId
      );

      if (matrixEntry) {
        const [vIndex] = matrixEntry;
        setNavigation(parseInt(vIndex, 10), 0);
      }
    }
  };

  return (
    <div className="w-full h-full bg-zinc-950 relative">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
        <h2 className="text-xl font-heading text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">
          XMAP Master Canvas
        </h2>
        <p className="text-xs font-sans text-white bg-zinc-900 border border-zinc-700 px-2 py-1 rounded inline-block w-max">
          Phase 10: Native Generative Rendering (Lights/Media/Agents)
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={renderedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        colorMode="dark"
        className="[&_.react-flow__pane]:bg-transparent"
      >
        <Controls className="bg-zinc-900 border border-zinc-800 fill-zinc-400" />
        <MiniMap
          className="bg-zinc-900 border border-zinc-800"
          maskColor="rgba(0,0,0,0.4)"
          nodeColor={(n) => {
            if (n.type === "coreNode") return "#6366f1";
            if (n.type === "ui.builder") {
              const data = n.data as any;
              const status = data?.plan?.devStatus || data?.status;
              if (status === "open" || status === "not-started") return "#f97316";
              if (status === "in-progress") return "#3b82f6";
              if (status === "blocked") return "#ef4444";
              if (status === "complete") return "#10b981";
              return "#71717a";
            }
            return "#52525b";
          }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#27272a"
        />
      </ReactFlow>
    </div>
  );
}
