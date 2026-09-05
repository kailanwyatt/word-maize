# Cursor prompt — integrate Word Maize Blender assets

Inspect the current project first and preserve all functional gameplay. Players tap visible kernels in spelling order; letters do not need to be adjacent; the word display submits; horizontal drag rotates; levels have 7 rows and 8–10 columns; rotation uses column units; harvested kernels reveal sockets. Do not restore drag tracing, adjacency restrictions, or release-to-submit.

Use the modular files in `assets/word-maize/models/` and treat `word-maize-models.json` as the geometry contract. Keep HUD, word button, basket, meter, and tools as React Native UI.

First implement an isolated vertical slice: load one `kernel.glb` over one `socket.glb`, position an app-rendered letter from `LetterAnchor`, verify tap raycasting, then hide the kernel and letter while leaving the socket visible. Approve it from front, 30°, 60°, and 90° before building the full board.

For the full renderer:

- Add an isolated `CornCobScene` component.
- Load each GLB once and reuse geometry/materials.
- Generate cylindrical transforms from each level's real rows and columns.
- Rotate a parent group containing body, sockets, kernels, letters, silk, and husks.
- Maintain stable game-kernel-ID to render-instance-ID mappings.
- Keep the game store authoritative; meshes only reflect state.
- Raycast only exposed, front-facing kernels.
- Preserve current tap-versus-horizontal-drag arbitration and selection during rotation.
- Never select a kernel when a drag release ends.
- Hide rear kernels from interaction.

Letters are not baked into models. Use a shared A–Z atlas or another batched strategy, place them at `LetterAnchor`, rotate them with kernels, avoid independent billboarding, and hide them with harvested kernels.

Visual states: gold normal; green emissive selection rim/pulse; distinct hint; temporary red invalid feedback; harvest outward along the radial normal then arc toward the basket; removed leaves the socket visible. Never mutate a shared material in a way that changes every instance.

Use Expo-compatible Three.js/React Three Fiber versions. Preserve web and native targets, transparent canvas output, capped mobile pixel ratio, low per-frame allocation, reused GPU resources, and safe disposal. If web/native renderers must differ, isolate them behind identical props.

Validate 8/9/10-column layouts, seam rotation, taps after rotation, selection persistence, rear rejection, layered kernels, valid/invalid submissions, adjacent socket reveals, responsive phone framing, and physical-device performance. Run existing tests and typecheck. Add tests for cylindrical transforms, angle normalization, front visibility, and stable instance mapping.

Do not remove the current PNG implementation until the 3D version passes comparison behind a development flag. Do not modify unrelated screens.
