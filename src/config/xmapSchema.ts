export interface XMAPMetadata {
  id: string;
  schema_version: string;
  version: string;
  created_at: string;
  created_by: string;
  intent_vector?: number[];
}

export interface XMAPManifest {
  manifest_id: string;
  manifest_version: string;
  manifest_status: "proposed" | "active" | "deprecated";
  target_hardware?: string[];
}

export interface SpatialCoordinates {
  x: number;
  y: number;
  z?: number;
}

export interface XMAPNodePlan {
  goal: string;
  date: string;
  versionId: string;
  planId: string;
  taskId: string;
  engineeringSize: "xs" | "sm" | "md" | "lg" | "xl";
  devStatus: "open" | "in-progress" | "blocked" | "complete";
  goalSuccessRequirement: string;
  authorId?: string;
  chatId?: string;
  promptId?: string;
  llmData?: string;
  fingerprintId?: string;
  workflowId?: string;
  orchestratorId?: string;
  agentId?: string;
  deploymentId?: string;
  evidenceUrl?: string;
}

export interface XMAPNode {
  node_id: string;
  node_type: string;
  name: string;
  status: string;
  capabilities: string[];
  deployment_metadata?: Record<string, any>;
  spatial_position: SpatialCoordinates;
  plan?: XMAPNodePlan;
}

export interface XMAPEdgePlan {
  goal: string;
  date: string;
  versionId: string;
  planId: string;
  taskId: string;
  engineeringSize: "xs" | "sm" | "md" | "lg" | "xl";
  devStatus: "open" | "in-progress" | "blocked" | "complete";
  goalSuccessRequirement: string;
  agentId?: string;
}

export interface XMAPEdge {
  edge_id: string;
  from_node: string;
  to_node: string;
  edge_type: "cf_mcp_relay" | "mcp_relay" | "builder_edge";
  label?: string;
  guardian_gate_ids?: string[];
  plan?: XMAPEdgePlan;
}

export interface XMAPWorkflow {
  id: string;
  target_nodes: string[];
  execution_mode: "durable_pause" | "immediate" | "stochastic";
  binding: string;
}

export interface XMAPGuardianPolicy {
  gate_id: string;
  type: "pre-workflow" | "post-workflow" | "realtime";
  evaluation_policy: "automated" | "manual";
  action_on_fail: "block" | "warn" | "heal";
}

export interface XMAPConfigControls {
  base_url: string;
  sync_frequency_ms?: number;
}

export interface XMAPSchemaDefinition {
  metadata: XMAPMetadata;
  manifest: XMAPManifest;
  diagram_first: { enforced: boolean };
  nodes: XMAPNode[];
  edges: XMAPEdge[];
  workflows: XMAPWorkflow[];
  guardian: XMAPGuardianPolicy[];
  validator: any[];
  tests: any[];
  telemetry: any[];
  provenance: any[];
  agent_views: any[];
  ui_contracts: any[];
  compliance: Record<string, any>;
  config_controls: XMAPConfigControls;
}
