# Pow3r Builder Components Matrix

**Author:** Principal AI Architect, Pow3r
**Date:** 2026-05-04
**Reference:** Pow3r Platform Architecture (v9)

## Executive Summary
This document synthesizes findings for the minimum viable **XMAP Builder Components (Nodes and Edges)** required to architect dynamic workflows mapping into JSON/React Flow/R3F/RaduxUI, aligning with the "Code as Config, Workflows as Code" Pow3r paradigm. It incorporates X-System telemetry (X-Bugger) and user communication (X-Messenger).

## Core Builder Components Array

| Rank | Name                  | Type  | Description                                                       | Features / Modes (JSON/Flow/R3F/Radux/3D) | Tags / Capabilities                | Recommendation                   | Instructions / Implementation Status |
|------|-----------------------|-------|-------------------------------------------------------------------|------------------------------------------|------------------------------------|----------------------------------|--------------------------------------|
| 1    | **WF Builder**        | Node  | API/MCP Workflow orchestrator when predefined blocks don't exist. | JSON schema editor, Flow node config     | \`workflow\`, \`mcp\`, \`api_build\`   | Critical for unbound workflows.  | High Priority. Add to XMAP schema.   |
| 2    | **X-Bugger**          | Node  | Visual telemetry, debugging, and advanced tracking.               | Unified Toast, Flow debugger, 3D metrics | \`telemetry\`, \`x_system\`, \`debug\` | Mandatory for Edge & Dev modes.  | Needs unified toast integration.     |
| 3    | **X-Messenger**       | Node  | Inter-component messaging and AI System/Expert Chat UI.           | RaduxUI Dialogs, System Chat, Toast      | \`chat\`, \`system_comm\`, \`ai_chat\` | Crucial for User/System comms.   | Link with unified notification event.|
| 4    | **Component Factory** | Node  | Base UI Generator Node (RaduxUI wrapper base).                    | R3F Wrapper, RaduxUI layout mapping      | \`ui_builder\`, \`unbound_ui\`       | Essential for UI generation.     | Mirror XMAP standard UI properties.  |
| 5    | **Data Router**       | Node  | JSON mutation and transformation for payload adaptation.          | JSON logic graph, Flow data transformer  | \`data_router\`, \`json_transform\`  | Necessary for mismatched APIs.   | Standard React Flow logic node.      |
| 6    | **3D Stage Builder**  | Node  | Configurator for R3F Canvas and 3D Particle engines.              | R3F configurator, 3D Particle Editor     | \`3d\`, \`webgl\`, \`spatial\`         | Priority for Media features.     | Anchor to XMAP spatial mapping.      |
| 7    | **Dynamic Edge**      | Edge  | Connecting workflow states with pass-through typing validation.   | Flow Edge, JSON mapping edge             | \`connection\`, \`data_bus\`         | Base requirement for all flows.  | Custom React Flow Edge component.    |
| 8    | **Agent Sandbox**     | Node  | Local LLM / Task runner component shell.                          | JSON agent spec, Radux status card       | \`agent\`, \`sandbox\`, \`execution\`  | Required for distributed agents. | Connect to edgeAgent service.        |

## Implementation Details

These components are designed to mirror the actual XMAP canvas state.
- **Modes Supported:** All components must switch rendering based on layoutMode (JSON spec, React Flow canvas, R3F WebGL view, standard Radux UI).
- **X-Bugger / X-Messenger Unified Toast System:** Instead of treating toast notifications as ephemeral, they will be bound to workflow Edges, maintaining a history in the X-Bugger state.
- **Edge Event Context Provisioning:** X-Bugger and X-Messenger provide all Edge information to the user. Specifically, when Builder Edge components are hit, they send the user and agents rich error messages, logs, toasts, and messages containing the context of the underlying component (status, not built, plan details, stage, etc.) structured in our unified callback/response format.
