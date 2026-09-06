# Word Maize — Corn Varieties and Endless Harvest Plan

## Purpose

Expand the approved rotating kernel board without replacing its geometry, controls, socket system, or word rules. Corn varieties add visual identity first and one understandable gameplay rule at a time. After Level 60, the same content powers a validated Endless Harvest mode.

## Non-negotiable visual contract

The current Sweet Corn kernel and socket are the master templates.

- Every variant uses the same transparent canvas, silhouette, center point, padding, front camera, and upper-front light direction.
- A full kernel must completely cover its matching socket at the center and through the existing cylindrical `scaleX`, scale, shade, and tilt transforms.
- Side perspective continues to come from the board layout code. We do not generate separate left/right sprites.
- Letters, selection borders, hints, obstacle states, and accessibility remain native app layers.
- Corn variety art may change color, gloss, surface texture, and small internal details, but never its outer footprint.
- Existing Sweet Corn art remains the permanent fallback until each new pair passes an in-app overlay test at center, near edge, and during rotation.

## Campaign varieties

### 1. Sweet Corn — Levels 1–12

- Palette: harvest gold `#FFC21A`, amber shadow `#C76808`, cream highlight `#FFF4B2`.
- Surface: smooth, plump, glossy.
- Mechanics: standard kernels, layers, rotation, tools, introductory obstacles.
- Purpose: teach the complete base game.

### 2. White Corn — Levels 13–20

- Palette: warm ivory `#FFF2C2`, pale gold `#E4BE64`, caramel shadow `#9A5B20`.
- Surface: pearly satin gloss with warm highlights; never gray.
- Mechanics: **Neighbor Reveal**. Some covered kernels activate after a nearby kernel is harvested.
- Readability: sleeping kernels receive a small husk-vein mark; their letters remain readable.
- Player lesson: plan harvesting order rather than only finding the longest immediate word.

### 3. Flint Corn — Levels 21–30

- Palette: controlled heritage mix of brick red `#A93620`, burnt orange `#D66A19`, navy blue `#263F73`, and muted gold `#D99B22`.
- Surface: hard, glassy shell with a stronger lower edge.
- Mechanics: **Armored Kernel**. First valid use cracks the shell; second valid use harvests it. Cracked state persists through rotation and saving.
- Readability: each board uses a restrained deterministic color distribution; never rainbow noise.

### 4. Popcorn — Levels 31–40

- Palette: pale butter `#FFE7A0`, honey `#E6A72B`, toasted edge `#9B551A`.
- Surface: smaller, rounder crown while preserving the master footprint and hit area.
- Mechanics: **Pop Charge**. Consecutive valid words charge marked kernels. At the threshold they pop, harvesting themselves and optionally one adjacent position.
- Feedback: three visible charge stages, a white puff, and a crisp pop sound. An invalid submission reduces charge but does not erase campaign progress.

### 5. Blue Corn — Levels 41–50

- Palette: indigo `#35418C`, blue-violet `#5850A6`, cool highlight `#B9B8F2`, plum shadow `#211840`.
- Surface: rich satin gloss with restrained speckling inside the silhouette.
- Mechanics: **Moonlit Letter**. Selected kernels begin veiled and become fully readable when rotated into the central viewing band, cleared by an obstacle interaction, or revealed by a tool.
- Accessibility: the hidden state changes pattern and contrast as well as color.

### 6. Golden Corn — Levels 51–60

- Palette: deep gold `#F6B800`, bright highlight `#FFF070`, bronze shadow `#8E470B`.
- Surface: premium metallic-gold suggestion without looking like a coin.
- Mechanics: **Festival Kernel**. Marked kernels grant bonus coins when included in longer valid words. Levels combine at most two previously learned rule families.
- Purpose: campaign mastery and the Harvest Festival finale.

## Visual deliverables per variety

Required before gameplay integration:

1. `kernel-full.png` — exact master silhouette and transparent canvas.
2. `kernel-empty-socket.png` — same footprint, matching rim color, deep opaque cavity.
3. `kernel-state.png` variants required by the mechanic (sleeping, cracked, charge stages, veiled, or festival).
4. `basket-fill.png` — small variety-specific basket contents.
5. `map-cob.png` — small chapter/map identifier.
6. `harvest-particle.png` — lightweight variety-specific particle.

Only the kernel and socket pair block engineering. Basket, map, and particles can follow after the pair passes the geometry gate.

## Asset approval gate

For each variety:

1. Compare its alpha bounds and canvas dimensions to the approved Sweet Corn source.
2. Render the full kernel directly above its socket at identical size; no rim may show.
3. Render a 7-row board at rotation offsets 0, 0.5, 1, and 2 columns.
4. Inspect the center column, both silhouette edges, harvested gaps, selection border, and native letters.
5. Verify compact iPhone and browser layouts.
6. Keep Sweet Corn fallback active until the visual review and automated checks pass.

## Implementation order

### Phase A — protect and prove the art pipeline

1. Freeze the current Sweet Corn art as the master geometry.
2. Generate White Corn full/socket assets as the first controlled recolor.
3. Add a developer-only variety preview that displays every state on the real rotating board.
4. Add automated asset-contract checks for filename, dimensions, transparency, and alpha bounds.
5. Approve White Corn in-app before generating the remaining final assets.

### Phase B — visual system with no rule changes

1. Replace the old per-kernel `variety` names with the six campaign variety IDs.
2. Put `cornType` on each level and centralize the level ranges.
3. Resolve kernel/socket art through one variety registry.
4. Render all varieties cosmetically while keeping Sweet Corn behavior everywhere.
5. Validate all 60 levels and migrate old saves without resetting progress.

### Phase C — one mechanic at a time

Implement Neighbor Reveal, Armored Kernel, Pop Charge, Moonlit Letter, and Festival Kernel sequentially. Each mechanic lives in `src/game`, is deterministic, has unit tests, and must not alter tap/submit/rotation behavior for other varieties.

### Phase D — level balancing

Assign mechanics and authored tutorials to Levels 13–60. Re-run guaranteed-word validation after every board change. Never combine more than one new variety mechanic with more than one obstacle/weather family in a normal campaign level.

### Phase E — Endless Harvest

- Unlock after Level 60.
- Generate from authored, seedable templates—not unconstrained random boards.
- Validate every offered cob before play.
- Increase difficulty every three completed cobs.
- Save current run, best run, seed, score, and earned rewards locally.
- Initial MVP rewards coins and periodic tool chests; Daily Cob and leaderboards remain post-MVP.

## Risk controls

- No board-layout rewrite.
- No separate renderer per variety.
- No side-angle sprite family.
- No generated art is referenced until copied into the repository and registered statically for Expo.
- Every new save field has a migration and a backward-compatible default.
- Each phase ends with type checking, unit tests, browser rotation review, and one-device smoke testing.

## Definition of done

The feature is complete when all six varieties are visually distinct, their full/socket pairs remain seamless through rotation, Levels 1–60 use the intended progression, all mechanics are deterministic and persisted, and completing Level 60 unlocks a validated, resumable Endless Harvest run.
