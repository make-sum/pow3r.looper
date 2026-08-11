/**
 * SharedPow3rControls — Looper HCI surface for @pow3r/controls SSOT.
 *
 * Open via ?view=pow3r-controls
 * Census: docs/status/SUPER_COMPONENT_INSTANCE_CENSUS.md §6
 */

import Pow3rControl from './Pow3rControl';
import { ConfigControlsPanel } from './ConfigControlsPanel';
import type { MCPControlDefinition } from '../config/pageSchemas';

const DEMO_CONTROLS: MCPControlDefinition[] = [
  {
    id: 'bpm',
    type: 'slider',
    label: 'BPM / Tempo',
    min: 60,
    max: 200,
    step: 1,
    defaultValue: 120,
    mcpAction: 'SYNC_TEMPO',
  },
  {
    id: 'genre',
    type: 'select',
    label: 'Primary Genre',
    options: ['Cyberpunk', 'Synthwave', 'Orchestral', 'Hip Hop'],
    defaultValue: 'Cyberpunk',
    mcpAction: 'UPDATE_GENRE_SEED',
  },
  {
    id: 'compressor',
    type: 'switch',
    label: 'Master Bus Compressor',
    defaultValue: true,
    mcpAction: 'TOGGLE_COMPRESSOR',
  },
];

export default function SharedPow3rControls() {
  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-8 max-w-xl mx-auto overflow-y-auto"
      data-testid="shared-pow3r-controls-looper"
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-cyan-400">Pow3r Controls</h1>
        <p className="text-xs text-zinc-500 font-mono">
          Looper host mount of @pow3r/controls (Pow3rControl adapter + ConfigControlsPanel).
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="adapter-heading">
        <h2 id="adapter-heading" className="text-sm font-semibold uppercase tracking-wide text-cyan-500">
          Pow3rControl adapter
        </h2>
        {DEMO_CONTROLS.map((ctrl) => (
          <Pow3rControl key={ctrl.id} control={ctrl} />
        ))}
      </section>

      <section className="space-y-2" aria-labelledby="panel-heading">
        <h2 id="panel-heading" className="text-sm font-semibold uppercase tracking-wide text-cyan-500">
          ConfigControlsPanel
        </h2>
        <ConfigControlsPanel
          configControls={{
            reverb: { type: 'slider', label: 'Hall Reverb', min: 0, max: 100, step: 1, default: 20 },
            key: {
              type: 'segmented',
              label: 'Key',
              options: ['Am', 'Cm', 'Em', 'Gm'],
              default: 'Am',
            },
          }}
        />
      </section>
    </div>
  );
}
