/**
 * ConfigControlsPanel — thin re-export of @pow3r/controls (canonical SSOT).
 *
 * Census: docs/status/SUPER_COMPONENT_INSTANCE_CENSUS.md §6
 * Package: pow3r.config/packages/controls
 */

export {
  Pow3rControls,
  ConfigControlsPanel,
  defaultsFromControls,
  isControlSpec,
  POW3R_CONTROLS_CATALOG_ID,
} from '@pow3r/controls';
export type {
  Pow3rControlsProps,
  ControlSpec,
  ControlType,
  ConfigControlsMap,
} from '@pow3r/controls';
