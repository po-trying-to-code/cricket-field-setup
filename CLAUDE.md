# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with HMR
npm run build      # Type-check then bundle (tsc -b && vite build)
npm run lint       # Run ESLint across all TS/TSX files
npm run preview    # Serve the production build locally
```

There is no test suite in this project.

## Architecture

This is a single-page React + TypeScript app (Vite) with **all logic in one file**: `src/App.tsx`. There is no routing, no external state management library, and no backend — all persistence is via `localStorage`.

### Data model

Three top-level entities, each stored separately in `localStorage`:

| Entity | Storage key | Purpose |
|---|---|---|
| `SavedFormation` | `cricket-field-saved-formations-v1` | Named team field setups |
| `BowlerPlan` | `cricket-field-bowler-plans-v1` | Per-bowler plans, each containing `BowlerScenario[]` |
| Active formation | `cricket-field-formation-v2` | Legacy single-formation storage, migrated on load |

A `SelectedPosition` is a `FieldPosition` (from the hardcoded `FIELD_POSITIONS` constant) extended with an `id` and a `fielderName`. Positions use `x`/`y` in 0–100 percentage coordinates relative to the field `<div>`.

### Coordinate system & mirroring

`getFieldPosition` applies two optional transforms to raw `FIELD_POSITIONS` coordinates:
1. **`isLeftHander`**: mirrors the x-axis (`x = 100 - x`) for right-hand batters (the raw data is left-hander-centric).
2. **`isEndOverRotated`**: rotates the entire field 180° (`x = 100 - x, y = 100 - y`) when the bowler switches ends.

These transforms are re-applied whenever the batter hand or end-of-over state changes; all stored positions are in the transformed coordinate space.

### Two parallel field instances

The app maintains two independent but structurally identical field contexts:
- **Team field** — the main formation, state prefixed with nothing (e.g., `players`, `isLeftHander`, `fieldRef`)
- **Bowler plan field** — a per-scenario field, state prefixed with `bowlerPlan` (e.g., `bowlerPlanPlayers`, `bowlerPlanIsLeftHander`, `bowlerPlanFieldRef`)

Every interaction handler (drag, snap, suggest, preset) is duplicated for each context. "Use Team Field" preset copies team field state into the bowler plan field.

### Drag interaction

Players on the field use pointer events (not drag-and-drop): `onPointerDown` sets a `draggingId`, `onPointerMove` updates `x`/`y`, and `onPointerUp`/`onPointerCancel` calls `snapPlayerToNearestPosition`, which finds the nearest named position via `Math.hypot` distance and snaps the player (swapping if another player occupies that spot). Bowler/Wicket Keeper are `REQUIRED_POSITIONS` and cannot be moved or removed.

Name chips (the player name badge) use HTML drag-and-drop (`draggable`, `onDragStart`, `onDrop`) to swap fielder names between positions.

Clicking an empty part of the field triggers `suggestFieldPosition`, which shows an `assignmentConfirm` dialog near the click point with the nearest available position.

### Export

`exportFormationImage` draws the field onto an off-screen `<canvas>` (1200×1350 px) — field circle, pitch, creases, stumps, batter figures, and player markers — then shares via `navigator.share` (mobile) or downloads as PNG.

### Validation

- `duplicateFielderNames` (useMemo): detects case-insensitive duplicate player names across positions.
- `depthConflictMessages` (useMemo): warns when two positions from the same `FIELD_DEPTH_GROUPS` zone are both selected (e.g., "Cover" and "Deep Cover").
- `normalizeSavedFormation` / `normalizeBowlerPlan` / `normalizeBowlerScenario`: defensive parsing helpers that validate unknown `localStorage` data before use, returning `null` on invalid input.

### Styling

All styles are in `src/App.css`. The layout is a single-column grid (`max-width: 720px`, centered) designed for mobile. No CSS framework or preprocessor is used.
