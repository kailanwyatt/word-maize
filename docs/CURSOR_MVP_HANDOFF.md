# Cursor handoff — Word Maize MVP art and presentation

You are working in the existing Expo + TypeScript project at `/Users/kurt/Documents/mobile-apps/word-maize`.

## Mission

Bring the approved Word Maize MVP to production-quality visual polish without rewriting its working game rules, progression, or persistence. Your primary responsibility is artwork, visual integration, responsive layout, and animation polish. Preserve the current playable cob interaction unless a visual change requires a small isolated renderer adjustment.

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

## Preserve before changing anything

1. Inspect the running app and existing assets.
2. Create before/after captures at an iPhone portrait viewport.
3. Keep the current PNG renderer available until a replacement is visually approved.
4. Do not edit authored level data, dictionary rules, scoring, persistence, rewards, ads, purchases, or unlock logic.
5. Work in small reviewable commits. Do not mix visual work with unrelated refactors.

## Art deliverables

Create and integrate a consistent final set for:

- Full kernel, selected kernel treatment, hint treatment, invalid treatment
- Empty recessed socket with a solid interior
- Cob/body backing that prevents background leakage
- Basket with empty, partially filled, and full states
- Kernel-to-basket harvest particles
- Patch portraits: idle, speaking, pointing, worried, celebrating
- Farmer May portrait: welcome and celebration
- Rusty tractor: idle and celebration
- Level-complete frame, star states, coin reward treatment, confetti/sparkles
- Sweet Corn Fields map nodes: current, complete, locked, three star states
- Restored/unrestored farm landmarks for Chapter One
- Tool icons and their active/hint effects
- Home, pause, settings, heart/energy, coin, star, rotate, and shuffle controls
- Story card, tutorial callout, objective card, shop card, daily reward card
- App icon, adaptive icon, splash/loading art, and store-feature graphic

Prefer reusable transparent PNG/WebP assets at 2x/3x for illustrated UI. Use native text for all changing labels and numbers. Do not bake letters, prices, level numbers, quantities, objectives, or dialogue into images.

## Cob implementation gate

Do not attempt the complete cob first. Build and obtain approval for one isolated unit:

1. One full kernel exactly covering one empty socket.
2. A native/app-rendered letter aligned on its face.
3. Normal, selected, invalid, hinted, and removed states.
4. Front, 30°, 60°, and near-edge views.
5. Tap targeting at every approved angle.

If the current 2.5D renderer can meet the target, keep it. Only use the Blender/GLB path in `assets/word-maize/models/` if it materially improves the result on a physical phone without harming performance. Do not migrate to Three.js merely because models exist.

For 3D, follow `docs/art-pipeline/README.md` and preserve the model contract. Rotate one parent group, reuse geometry/materials, cap pixel ratio, avoid per-frame allocations, raycast only exposed front-facing kernels, and keep an identical React Native-facing component API.

## Screen completion order

1. Gameplay and completion screen
2. Farm/Home
3. Sweet Corn Fields map
4. Story/tutorial presentation
5. Shop and tool details
6. Daily Harvest
7. Pause, Settings, and How to Play
8. Splash, icon, and store imagery

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
- Existing tests and typecheck pass
- No gameplay/data changes hidden inside an art commit

When blocked by a gameplay or data issue, document the exact file, reproduction steps, and expected behavior. Do not redesign the underlying rule to work around it.
