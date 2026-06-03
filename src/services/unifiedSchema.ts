export type MCPToolAction =
  | "GENERATE_MEDIA"
  | "ENHANCE_PROMPT"
  | "PROCESS_AUDIO"
  | "EXTRACT_CONTEXT"
  | "UPDATE_KNOWLEDGE_GRAPH"
  | "AGENT_CHAT"
  | "SYNC_ABACUS"
  | "DEPLOY_CLOUDFLARE"
  | "AUDIT_WORKFLOW"
  | "UPDATE_PARAMETER"
  | "IMPORT_SEQUENCE"
  | "CONFIGURE_AGENT"
  | "GENERATE_MOTION"
  | "INFER_GENERATIVE_TRACK"
  | "LOCAL_AGENT_INVOKE"
  | "ORCHESTRATE_AI_STEMS";

export interface Pow3rRequestPayload<T = any> {
  schema_version: string;
  telemetry_id: string;
  workflow_id: string;
  action: MCPToolAction;
  timestamp: string;
  context: {
    user_id?: string;
    device_mode: "local" | "edge" | "cloud";
    user_context_ref?: string; // UKG reference
    agent_context_ref?: string; // AKG reference
    media_context_ref?: string; // MKG reference
  };
  data: T;
}

export interface Pow3rResponsePayload<T = any> {
  schema_version: string;
  telemetry_id: string;
  workflow_id: string;
  action: MCPToolAction;
  status: "success" | "error" | "pending";
  timestamp: string;
  execution_ms: number;
  data: T | null;
  error?: {
    code: string;
    message: string;
    stacktrace?: string;
  };
  logs: Array<{
    level: "info" | "warn" | "error" | "system";
    message: string;
    timestamp: number;
  }>;
}

// Helper builder for wrapping requests
export function buildPow3rRequest<T>(
  action: MCPToolAction,
  data: T,
  deviceMode: "local" | "edge" | "cloud" = "edge",
): Pow3rRequestPayload<T> {
  return {
    schema_version: "2.0",
    telemetry_id: `tel_${Math.random().toString(36).substring(2, 9)}`,
    workflow_id: `wf_${Math.random().toString(36).substring(2, 9)}`,
    action,
    timestamp: new Date().toISOString(),
    context: { device_mode: deviceMode },
    data,
  };
}

// Wrapper utility for executing services under the unified schema constraint
export async function executePow3rWorkflow<TRequest, TResponse>(
  request: Pow3rRequestPayload<TRequest>,
  executor: (data: TRequest) => Promise<TResponse>,
): Promise<Pow3rResponsePayload<TResponse>> {
  const t0 = performance.now();
  const logs: Array<{
    level: "info" | "warn" | "error" | "system";
    message: string;
    timestamp: number;
  }> = [];

  logs.push({
    level: "system",
    message: `Initializing MCP Workflow: ${request.action}`,
    timestamp: Date.now(),
  });

  try {
    // Execution
    const result = await executor(request.data);

    logs.push({
      level: "system",
      message: `Execution completed successfully.`,
      timestamp: Date.now(),
    });

    return {
      schema_version: request.schema_version,
      telemetry_id: request.telemetry_id,
      workflow_id: request.workflow_id,
      action: request.action,
      status: "success",
      timestamp: new Date().toISOString(),
      execution_ms: performance.now() - t0,
      data: result,
      logs,
    };
  } catch (error: any) {
    logs.push({
      level: "error",
      message: `Execution failed: ${error.message}`,
      timestamp: Date.now(),
    });
    return {
      schema_version: request.schema_version,
      telemetry_id: request.telemetry_id,
      workflow_id: request.workflow_id,
      action: request.action,
      status: "error",
      timestamp: new Date().toISOString(),
      execution_ms: performance.now() - t0,
      data: null,
      error: {
        code: "WORKFLOW_ERR",
        message: error.message || "Unknown error occurred.",
        stacktrace: error.stack,
      },
      logs,
    };
  }
}
