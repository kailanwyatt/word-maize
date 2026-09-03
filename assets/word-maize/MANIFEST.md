# Word Maize — Prototype Asset Manifest

## Reference-matched V2 gameplay family

The gameplay screen now uses a second, non-destructive asset family generated directly from the approved Core Game Flow and MVP design boards:

- `corn/cob-full-v2.png` — full broad golden cob with restrained husks
- `kernels/yellow/kernel-normal-v2.png` — rounded-square blank letter kernel
- `kernels/yellow/kernel-empty-socket-v2.png` — dark harvested recess with torn golden rim
- `backgrounds/gameplay-farm-v2.png` — deep-blue vignetted farm background with central negative space

The original assets remain available for comparison and rollback, but are not used for the main cob, normal kernels, sockets, or gameplay backdrop.

First production batch for the playable Expo prototype. All gameplay sprites use transparent PNGs; the farm background is an opaque portrait PNG.

## Ready now

| Group | Files | Prototype use |
| --- | --- | --- |
| Cob | `corn/cob-core.png`, `corn/husk-left.png`, `corn/husk-right.png`, `corn/husk-bottom.png` | Layered central cob and decorative husk framing |
| Kernels | `kernels/yellow/kernel-normal-01.png` through `03.png` | Randomized yellow kernel faces; overlay letters natively |
| Kernel states | `kernel-selected.png`, `kernel-hint.png`, `kernel-empty-socket.png`, `kernel-flying.png` | Drag selection, Scarecrow hint, harvest reveal, pop/fly animation |
| Gameplay props | `props/harvest-basket.png` | Harvest/progress decoration |
| Power-ups | `powerups/scarecrow.png`, `butter-brush.png`, `corn-picker.png` | MVP tool belt and active-tool overlays |
| Background | `backgrounds/gameplay-farm.png` | 1080 × 1920 portrait gameplay scene with open center |
| Effects | `effects/sparkle-burst.png`, `kernel-pop.png`, `butter-trail.png` | Completion sparkle, kernel removal impact, Butter Brush path |

## Implementation notes

- Render letters, selection paths, score, counts, and harvest percentage as native React Native UI.
- Use the three normal kernels with deterministic variation by board position.
- Place the empty socket under each removable kernel; swap/fade the kernel out after a valid word.
- `kernel-selected.png` includes the cyan selection treatment; `kernel-hint.png` includes the green hint treatment.
- Animate the flying kernel, pop puff, sparkles, and butter trail with transform/opacity rather than sprite sheets for the first prototype.
- The cob art is a front-facing prototype layer set. True cylindrical rotation should be driven by the kernel grid and transforms; additional side/back cob art can follow after feel testing.

## Export checks

- 19 PNG assets total.
- 18 sprites contain alpha transparency.
- The background is opaque and sized for a portrait Expo screen.
- Filenames are lowercase kebab-case and grouped by runtime purpose.

## Generation direction

Built with the built-in image generator using a consistent prompt family: polished friendly casual-game 3D illustration, tactile hand-painted farm materials, rounded forms, warm storybook lighting, harvest-gold/leaf-green/rustic palette, isolated clean-alpha sprites, and no baked-in text or UI.
