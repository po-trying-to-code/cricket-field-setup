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

## Branches

- **`main`** — field planner only (formations + bowler plans). **Do not commit or push to `main`.** It is kept as a standalone, stable application.
- **`team-planner`** — the active development branch. All new work goes here. Always commit and push to `team-planner`. See [Team-planner additions](#team-planner-additions) for what this branch adds.

## Architecture

This is a single-page React + TypeScript app (Vite) with **all logic in one file**: `src/App.tsx`. There is no routing, no external state management library, and no backend — all persistence is via `localStorage`.

### Data model (`main`)

Three top-level entities on `main`, each stored separately in `localStorage`:

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

### Styling (`main`)

All styles are in `src/App.css`. The layout is a single-column grid (`max-width: 720px`, centered) designed for mobile. No CSS framework or preprocessor is used.

---

## Team-planner additions

The `team-planner` branch extends the app with a **tabbed coaching planner** that wraps the existing field/bowler-plan UI as one tab among many.

### Navigation model

The UI is divided into **groups** (rendered as a top-level nav) and **tabs** within each group:

| Group | Tabs (`PlannerTabId`) |
|---|---|
| Home | `overview` |
| Training | `practice`, `fitness`, `drills` |
| Team | `team` |
| Resources | `video-library` |
| Match Planning | `fielding`, `match-notes`, `scoring` |

`overview`, `fielding`, and `video-library` are display-only tabs with no editable `PlannerSection`. The remaining five (`practice`, `fitness`, `drills`, `team`, `match-notes`) are `PlannerSectionId` tabs that have persisted state.

### New data model additions

| Entity | Storage key | Purpose |
|---|---|---|
| `PlannerSection` | `cricket-team-planner-sections-v1` | One section per `PlannerSectionId`, stored as an array |
| `MatchScore` | `cricket-match-scores-v1` | Ball-by-ball match records |
| `SquadPlayer` | part of `PlannerSection` (team tab) | Per-player name, role, batting hand, bowling type, coaching notes |

A `PlannerSection` holds: `title`, `goals`, `notes` (free text), `checklistItems: ChecklistItem[]`, `resourceLinks: ResourceLink[]`, and `opponentPlayers: OpponentPlayer[]` (only used in `match-notes`). It also carries `workspaceId` / `createdBy` / `updatedBy` / timestamps — currently hardcoded to `"local-workspace"` / `"local-coach"` as placeholders for a future multi-user design.

`plannerSections` state is a `Record<string, PlannerSection>` keyed by `sectionId`. `persistPlannerSections` serialises it as `Object.values(next)` (an array) to `localStorage`, then `normalizePlannerSection` parses it back defensively on load.

### Templates

`COACH_TEMPLATES` is a hardcoded array of `PlannerTemplate` objects grouped by `sectionId`. Each template provides preset `title`, `goals`, `checklistItems[]`, `notes`, and optional `resourceLinks`. Applying a template via `applyPlannerTemplate` overwrites the matching `PlannerSection` fields (it does not merge).

`PLANNER_TEMPLATE_DEFAULTS` provides the initial empty-state defaults for each section used by `createPlannerSection`.

### Coaching resource links

`COACHING_RESOURCE_LINKS` and `VIDEO_RESOURCE_CATEGORIES` are hardcoded constants that populate the `video-library` tab and template resource link suggestions. They reference external URLs (Cricket Victoria, PlayCricket) and are not editable by the user.

### `match-notes` specifics

The `match-notes` section adds an `opponentPlayers: OpponentPlayer[]` list (name, role, strengths, plan) alongside the standard goals/checklist/notes. `addOpponentPlayer`, `updateOpponentPlayer`, and `removeOpponentPlayer` are dedicated mutation helpers that always target the `"match-notes"` section directly.

### `scoring` tab

The `scoring` tab is a full live match scorer. It has its own sub-navigation (`ScoringViewId`):

| View | Purpose |
|---|---|
| `list` | All saved matches; start new or resume |
| `setup` | Configure match: teams, squad lists, format, max overs, toss |
| `live` | Ball-by-ball scoring: runs, extras, wickets, scoring zones |
| `scorecard` | Batsman and bowler statistics for the active innings |
| `analysis` | Zone heatmap of where runs were scored |

A `MatchScore` contains two `MatchInnings`, each holding `MatchOver[]` → `Delivery[]`. A `Delivery` records: `runs`, `isBoundary`, `boundaryType`, `isExtra` / `extraType` / `extraRuns`, `isWicket` / `dismissalType` / `fielderName`, `scoringZone`, and the batsman/bowler names.

Scoring state flows through a `PendingDelivery` draft that is committed to the innings when the user confirms. End-of-over is detected automatically (6 legal deliveries) and triggers a modal to set the next bowler and swap strike. Extras (wide, no-ball) do not consume a legal ball count.

`BatsmanStats` and `BowlerStats` are derived summaries computed from the `Delivery[]` array and stored inline on each `MatchInnings` for persistence.

### Styling (`team-planner`)

CSS is split into multiple files under `src/styles/`:

| File | Covers |
|---|---|
| `base.css` | CSS variables, resets, global typography |
| `nav.css` | Top nav groups and tab bar |
| `overview.css` | Home/overview tab layout |
| `fielding.css` | Field planner and bowler plan styles (migrated from `App.css`) |
| `team.css` | Squad roster tab |
| `scoring.css` | Live scoring views |
| `template-sections.css` | Practice/fitness/drills/match-notes planner sections |
| `video-library.css` | Resources/video-library tab |

`src/App.css` imports all of the above and retains only minimal legacy declarations.

### Deployment

A GitHub Actions workflow (`.github/workflows/deploy-team-planner.yml`) auto-deploys the `team-planner` branch to Vercel on every push.
