# Cursor handoff — Word Maize MVP integration and presentation

You are working in the existing Expo + TypeScript project at `/Users/kurt/Documents/mobile-apps/word-maize`.

## Mission

Bring the approved Word Maize MVP to production-quality visual polish without rewriting its working game rules, progression, or persistence. ChatGPT/Codex creates and supplies all raster artwork and visual references. Cursor's responsibility is code implementation, asset integration, responsive layout, animation, debugging, and device QA.

**Cursor does not create, generate, redraw, retouch, or replace artwork.** If an asset is missing, inconsistent, has a baked background, needs a new pose/state, or cannot satisfy the layout, stop and add it to the missing-art report described below. Use a temporary code-native placeholder only when it is clearly labeled and isolated. Do not use image generation, Blender, tracing, background removal, or improvised CSS/canvas illustration as a substitute for approved art.

## Non-negotiable gameplay contract

- Players tap visible kernels in spelling order; letters do not need to be adjacent.
- The assembled word is submitted by pressing the word display.
- Horizontal drag and the two buttons rotate the cylindrical board.
- Selection persists while the cob rotates.
- Column zero wraps to the final column.
- Only the first unharvested layer at a position is exposed.
- A valid word removes its selected kernels; a matching socket remains or the next layer appears.
- Game state and rules remain in `src/game`; visuals consume that state.
- Generated art is presentation, never game data.
- Do not restore drag-to-trace, adjacency, or release-to-submit.

Run `npm test` and `npm run typecheck` after every meaningful integration pass.

## Visual target

Use the current approved playable demo as the interaction and composition baseline. The visual identity is premium casual farming: dimensional glossy golden kernels, deep recessed sockets, warm wood, saturated greens, readable cream typography, soft contact shadows, and playful but restrained animation. It should feel tactile and cohesive rather than photorealistic or flat.

The center cob must read as a curved volume. Side kernels and letters visibly turn away from the viewer; the center column remains straight. Left-side faces lean inward/right and right-side faces lean inward/left, reversing naturally as the cob rotates. Empty sockets must occupy exactly the same footprint as full kernels and must never reveal the background through the board.

## Current project state

- Expo + TypeScript app with deterministic gameplay under `src/game`.
- Tap-to-build word selection, press-word-to-submit, cylindrical rotation, layers, harvesting, tools, haptics, audio, persistence, economy, and completion flow are implemented.
- Sixty validated levels exist across four 15-level chapters.
- Chapter maps, the store, local progression, obstacles, and resume behavior are implemented.
- Each chapter has a dedicated map illustration. A chapter gate at the top moves to the next region after the final level is completed; previous chapters remain accessible.
- Levels 11–45 currently include caterpillar, crow, squirrel, and weed obstacle rules and supplied artwork.
- The approved transparent coin and tractor assets are already integrated.

Recent baseline commits:

- `46cde09` — continuous map art and transparent coin
- `85ba5b7` — chapter maps and path-aligned level placement

Inspect the actual Git history if these hashes are no longer at the tip; never reset or discard newer user/Codex changes.

## Preserve before changing anything

1. Inspect the running app and existing assets.
2. Create before/after captures at an iPhone portrait viewport.
3. Keep the current PNG renderer available until a replacement is visually approved.
4. Do not edit authored level data, dictionary rules, scoring, persistence, rewards, ads, purchases, obstacle behavior, or unlock logic.
5. Work in small reviewable commits. Do not mix visual work with unrelated refactors.

## Artwork ownership and supplied assets

Codex owns creation and correction of the following artwork. Cursor may only integrate supplied files and report missing variants:

- Full kernel, selected kernel treatment, hint treatment, invalid treatment
- Empty recessed socket with a solid interior
- Cob/body backing that prevents background leakage
- Basket with empty, partially filled, and full states
- Kernel-to-basket harvest particles
- Patch portraits: idle, speaking, pointing, worried, celebrating
- Farmer May portrait: welcome and celebration
- Rusty tractor: idle and celebration
- Level-complete frame, star states, coin reward treatment, confetti/sparkles
- Four chapter map backgrounds and map-node treatments: current, complete, locked, and star states
- Restored/unrestored farm landmarks for Chapter One
- Tool icons and their active/hint effects
- Home, pause, settings, heart/energy, coin, star, rotate, and shuffle controls
- Story card, tutorial callout, objective card, shop card, daily reward card
- App icon, adaptive icon, splash/loading art, and store-feature graphic

Primary supplied-art registry: `assets/word-maize/assets.ts`.

Important existing folders:

- `assets/word-maize/backgrounds/` — gameplay and chapter-map artwork
- `assets/word-maize/corn/` and `assets/word-maize/kernels/` — cob, kernel, and socket assets
- `assets/word-maize/obstacles/` — farm obstacles
- `assets/word-maize/powerups/` — tool illustrations
- `assets/word-maize/props/` — basket and transparent tractor
- `assets/word-maize/ui/` — logo, transparent coin, and controls

Use native text for all changing labels and numbers. Never bake letters, prices, level numbers, quantities, objectives, or dialogue into images.

When artwork is missing, append an entry to `docs/CURSOR_MISSING_ART.md` containing:

1. Screen and exact state where it is needed.
2. Proposed filename and destination folder.
3. Required dimensions/aspect ratio and whether alpha transparency is required.
4. Composition, pose, lighting, and edge-padding requirements.
5. A screenshot showing the intended placement.
6. The current temporary fallback, if any.

Continue with unrelated integration work after reporting the gap. Do not attempt to create the asset.

## Cob implementation gate

Do not replace the complete cob first. Validate one isolated supplied-art unit before changing the renderer:

1. One full kernel exactly covering one empty socket.
2. A native/app-rendered letter aligned on its face.
3. Normal, selected, invalid, hinted, and removed states.
4. Front, 30°, 60°, and near-edge views.
5. Tap targeting at every approved angle.

If the current 2.5D renderer can meet the target, keep it. Only use the Blender/GLB path in `assets/word-maize/models/` if it materially improves the result on a physical phone without harming performance. Do not migrate to Three.js merely because models exist.

For 3D, follow `docs/art-pipeline/README.md` and preserve the model contract. Rotate one parent group, reuse geometry/materials, cap pixel ratio, avoid per-frame allocations, raycast only exposed front-facing kernels, and keep an identical React Native-facing component API.

## Cursor's next tasks, in order

1. Run the app and capture the current gameplay, completion, Farm/Home, chapter map, Store, Daily Harvest, Settings, and How to Play screens at small and large iPhone sizes.
2. Fix responsive layout defects using existing assets. Prioritize clipped controls, safe areas, modal overflow, illegible type, inconsistent spacing, and undersized touch targets.
3. Verify the complete Level 1 → completion → Level 2 loop. The chapter map must center Level 2, allow selection, and expose the Play button.
4. Verify all four 15-level chapter maps: touch scrolling on device, wheel scrolling on web, path-aligned nodes, current/completed/locked states, chapter gates, and returning to previous chapters.
5. Polish cob and harvest animation timing with the existing kernel/socket/basket assets. Preserve gameplay behavior and reduced-motion handling.
6. Polish completion, story/tutorial, Store, tool detail, Daily Harvest, pause, Settings, and How to Play layouts using supplied artwork.
7. Test Levels 1, 10, 11, 15, 16, 30, 31, 45, 46, and 60 to cover chapter transitions, obstacles, board sizes, and final progression.
8. Produce `docs/CURSOR_MISSING_ART.md` for every remaining visual gap; do not generate the missing files.
9. Run the full automated checks and physical-device smoke test, then leave small reviewable commits grouped by screen or behavior.

For every screen, verify small and large iPhones, safe areas, dynamic text length, touch targets, modal scrolling, and web fallback. Avoid absolute positioning tied to one simulator size.

## Animation requirements

- Cob rotation eases into its snapped resting position without flashing or reordering.
- Selection uses one strong white-green outline/glow; do not separately recolor the letter.
- Accepted kernels briefly lift/enlarge, rotate toward the basket, shrink, and settle into it.
- Socket or deeper-layer reveal happens at the moment the flying kernel clears the board.
- Completion stars arrive one at a time; rewards count up; celebration remains skippable.
- Respect reduced-motion settings with shorter fades/scales.

## Acceptance checklist

- One coherent art style across every MVP screen
- No background visible through sockets or board seams
- Letters remain centered and readable across rotation
- Side perspective matches cylindrical curvature
- Selected/removed state cannot be mistaken
- Gameplay remains responsive during animation
- 8-, 9-, and 10-column boards work
- Layered kernels work
- All controls work on web and a physical Expo development build
- The map supports touch scrolling on mobile and wheel/trackpad scrolling on web
- Each chapter ends at a clear gate; unrelated scenery is never stitched into one continuous canvas
- Level nodes visually follow the road/path painted into each supplied chapter map
- Existing tests and typecheck pass
- No gameplay/data changes hidden inside an art commit

When blocked by a gameplay or data issue, document the exact file, reproduction steps, and expected behavior. Do not redesign the underlying rule to work around it.
