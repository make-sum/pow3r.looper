/**
 * Pow3rControl — single MCP control via @pow3r/controls SSOT.
 *
 * Census: docs/status/SUPER_COMPONENT_INSTANCE_CENSUS.md §6
 * Package: pow3r.config/packages/controls
 *
 * Keeps Looper UPDATE_PARAMETER / toast side effects; UI renders through Pow3rControls.
 */

import { useCallback, useMemo, useState } from 'react';
import { Pow3rControls, type ConfigControlsMap, type ControlSpec } from '@pow3r/controls';
import { MCPControlDefinition } from '../config/pageSchemas';
import { useAppStore } from '../store/appStore';
import { buildPow3rRequest, executePow3rWorkflow } from '../services/unifiedSchema';
import { toast } from 'sonner';

/* pow3r-config-ui-binding */
import { useConfig, config_controls, componentConfig } from '../config/pow3rConfig';
// Agent Note: Unbound UI — stamp config_controls.base_url on the document for this surface.
if (
  typeof document !== 'undefined' &&
  config_controls &&
  typeof config_controls === 'object' &&
  'base_url' in config_controls
) {
  document.documentElement.dataset.pow3rConfigBase = String(
    (config_controls as { base_url?: string }).base_url || '',
  );
}
void useConfig;
void componentConfig;

function toControlSpec(control: MCPControlDefinition): ControlSpec {
  const type =
    control.type === 'select'
      ? 'segmented'
      : control.type === 'button'
        ? 'switch'
        : control.type;
  return {
    type,
    label: control.label,
    min: control.min,
    max: control.max,
    step: control.step,
    default: control.defaultValue,
    options: control.options,
  };
}

export default function Pow3rControl({
  control,
}: {
  control: MCPControlDefinition;
  key?: string | number;
}) {
  const appendLogs = useAppStore((state) => state.appendLogsFromPayload);
  const configControls = useMemo<ConfigControlsMap>(
    () => ({ [control.id]: toControlSpec(control) }),
    [control],
  );
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    [control.id]: control.defaultValue,
  }));

  const handleValuesChange = useCallback(
    async (next: Record<string, unknown>) => {
      const newVal = next[control.id];
      setValues(next);

      const request = buildPow3rRequest('UPDATE_PARAMETER', {
        componentId: control.id,
        newValue: newVal,
      });

      const response = await executePow3rWorkflow(request, async () => {
        await new Promise((r) => setTimeout(r, 150));
        return { parameter: control.id, updatedTo: newVal };
      });

      appendLogs(response);
      toast.success('Parameter Updated', {
        description: `${control.label} set to ${newVal}`,
      });
    },
    [appendLogs, control.id, control.label],
  );

  return (
    <div
      className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg"
      data-testid={`pow3r-control-${control.id}`}
    >
      <Pow3rControls
        configControls={configControls}
        values={values}
        onValuesChange={handleValuesChange}
        className="space-y-2"
      />
    </div>
  );
}
