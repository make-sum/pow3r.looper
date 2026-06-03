# Pow3r Platform - User Journey Navigation Architecture

## Executive Summary
This document finalizes the navigation architecture for the **Pow3r Platform Surface Editor**. As the Principal AI Architect, I have evaluated the conflicting "Down vs Up" gesture logics alongside the need to seamlessly integrate Looper Editor Views with generated Track Views in an unbound execution state.

## Critique of Proposals
The initial proposal introduced contradictory flows ("Swipe Down for Editors NAV", which asserted that swipe-down jumps to Tracks while also cycling through Editors). This creates cognitive dissonance for users who expect a persistent spatial mental model. 

When users operate a high-configurability environment like Pow3r, spatial permanence is crucial:
* If "Swipe Down" moves to *Previous*, and "Swipe Up" moves to *Next*, this mapped inversely to standard touch-screen scrolling (where pulling up pushes content up, revealing what is below).
* Jumping between "Editor Mode" and "Track Mode" vertically breaks the linear sequence, leading to accidental mode-switching.

## The Optimal Architecture: "Simple Swipe NAV"
We are implementing the "Simple Swipe NAV" design. It adopts a unified, 1-dimensional array that wraps recursively, ensuring smooth spatial continuity.

1. **The Loop Topology:**
   We map the entire surface onto an unbroken topological ring with indices from `-6` to `+6`.
   * **The Editor Wing (Indices -6 to -1):**
     * -6: XMAP JSON Validator
     * -5: XMAP Master Canvas
     * -4: Sampler
     * -3: Mixer
     * -2: Sequencer
     * -1: Loop Player
   * **The Track Wing (Indices 0 to 6):**
     * 0: Music
     * 1: Voice
     * 2: Image
     * 3: Video
     * 4: Lighting
     * 5: SFX / Lasers
     * 6: Agent Generator (Code)

2. **The Runtime Gate:**
   By default, the platform boots at `-6` (XMAP JSON). The user can cycle vertically between `-6` and `-1` (the Editors).
   Upon validating the environment (executing the runtime from the JSON Validator), the **Runtime Gate unlocks**, expanding the accessible indices to include the full spectrum `[-6, 6]`. The user is seamlessly deposited at index `0` (Music track) to begin modifying runtime generated outputs.

3. **Gestural Mapping:**
   * **Up Arrow / Wheel Up / Swipe Up (Pull Down):** `index - 1` (traverses backwards through the array).
   * **Down Arrow / Wheel Down / Swipe Down (Pull Up):** `index + 1` (traverses forwards through the array).
   * **Overshoot Wrapping:** Scrubbing past `-6` wraps to `6` (if runtime executed) or `-1` (if locked). Scrubbing past `6` wraps to `-6`.

## XMAP Implementation
This UX journey has been codified as a top-level node (`node-user-journey-nav`) within the XMAP Unified Canvas, asserting the node capabilities `["linear_swipe_nav", "unified_loop_cycle", "runtime_gate"]`. The `SurfaceView` and `SchemaSidebar` React nodes operate as physical manifestations of this UI/UX pipeline topology.
