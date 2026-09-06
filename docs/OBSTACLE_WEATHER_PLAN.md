# Word Maize obstacle and weather production plan

This document is the implementation and artwork contract for gameplay threats. Obstacles advance only after an accepted word; thinking time is never punished. Every affected letter remains native text.

## Visual rule: choose the correct attachment level

1. **Kernel variants** replace the normal kernel art at the exact same footprint. Use these when the effect physically belongs to one kernel: weed, frost, drought.
2. **Perched actors** are anchored to one kernel but may extend outside it: caterpillar. The target kernel remains readable and the creature shares its perspective transform.
3. **Board actors** move independently and point to a kernel with a target marker: crow and squirrel. Do not shrink the full animal into a tiny sticker.
4. **Cluster overlays** span several kernels: spider web. The web must follow the board transform and never masquerade as one kernel.
5. **Whole-board weather** sits behind native HUD/letters and above the background: wind, rain, fog, and night.

## Rollout and player behavior

### 1. Caterpillar — Levels 11–15

- Perches on one kernel and shows a 3-word countdown.
- The kernel is selectable until the countdown reaches zero.
- Using the kernel in a valid word removes the caterpillar.
- Butter Brush removes it immediately.
- Artwork: `caterpillar-perched-v2.png`, plus later chew/startle/exit frames.

### 2. Crow — Levels 16–19 and combination levels

- Crow circles above the cob; a shadow/target ring identifies its kernel.
- After two accepted words it steals or blocks that kernel.
- Harvesting the target first prevents the attack.
- Scarecrow blocks the next attack.
- Artwork: board-sized crow poses, feather particles, and a separate target shadow. Never bake the crow into a kernel.

### 3. Squirrel — Levels 20–30

- Appears beside one target with a 2–3-word warning.
- Pulls at the kernel, then steals it if unanswered.
- Harvest the target, use Scarecrow, or use Corn Picker.
- Artwork: board actor poses, target outline, kernel-carry pose, and dust. Never render the squirrel as a small corner badge.

### 4. Weed — Levels 31–35

- Implemented as `weed-kernel-v2.png`: the normal kernel is replaced by a same-footprint vine-wrapped kernel.
- The native letter remains centered and readable.
- Weed kernels are locked until Butter Brush clears them or a level-specific clearing condition is met.
- Future growth set: sprout, medium, and fully wrapped kernel variants using the same footprint.

### 5. Spider web — Levels 36–37

- Covers a deterministic 2×2 cluster rather than one kernel.
- Covered kernels are locked until the player completes the shown clearing word or uses Butter Brush.
- Artwork: transparent cluster web with four anchor points, damage state, and break particles.

### 6. Rain — Level 38 onward

- Declared on the intro card before play.
- Every accepted word earns a small rain bonus.
- At configured intervals, rain reveals one deterministic fresh under-layer kernel when available; it never changes letters randomly or makes the board unsolvable.
- Artwork: looping board rain, wet sheen, splash particles, and a compact HUD badge.

### 7. Drought — Levels 39–40

- Declared before play. Clearly marked kernels dry one step after accepted words.
- A fully dry kernel locks; no real-time timer is used.
- Butter Brush protects one affected kernel. A Watering Can is post-MVP.
- Artwork: healthy, dry, and cracked same-footprint kernel variants plus dust.

### 8. Wind — Level 47 onward

- Declared before play.
- After configured accepted words, the cob rotates one controlled snap, alternating direction predictably.
- Wind never fires while a word is selected or an animation is running.
- Artwork: whole-board wind streaks, drifting leaves, and a HUD badge.

### 9. Fog and night — later Chapter Four

- Reduce peripheral visibility but never hide the front playable columns.
- Rotation brings dim letters into full visibility.
- Lantern remains a future tool; levels must remain completable without purchases.

## Implementation order

1. Finish caterpillar anchored rendering and countdown feedback.
2. Separate crow/squirrel actors from target markers.
3. Add web cluster data and rendering.
4. Add deterministic weather API and persisted turn count.
5. Ship rain and wind first; playtest before drought/fog/night.
6. Add sound and multi-frame animation only after rules are readable with static art.

## Acceptance criteria

- Kernel variants occupy the exact normal-kernel footprint through every cob angle.
- Native letters remain legible and correctly transformed.
- The player can identify the threat, target, remaining turns, and counter without opening help.
- All progression is deterministic and resumes exactly after restarting the app.
- Every obstacle can be beaten without purchasing a tool.
- No obstacle advances while the player is merely thinking.
