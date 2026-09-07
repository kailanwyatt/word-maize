# Obstacles

All obstacle rules live in `src/game/obstacles.ts`. Invalid submissions do not advance word-based obstacles. Letters can be selected anywhere on the visible cob; adjacency matters only for cutting and spreading weeds.

| Obstacle | Pressure | Word-based counter | Tool shortcut |
| --- | --- | --- | --- |
| Caterpillar | Each eats one exposed kernel after 20 seconds; additional caterpillars start at 27 and 34 seconds. Later caterpillar levels introduce a third. | Harvest its kernel before expiry. | Butter Brush clears one; Corn Picker harvests the target. |
| Crow | Marks a kernel for two accepted words, hides its letter for the next two, then returns it and leaves. | Harvest the target before the swoop, or complete two words while it is away. | Scarecrow clears one; Corn Picker harvests the target. |
| Squirrel | Guards a kernel immediately. Multiple squirrels create a stash to release gradually. | Each word of at least five letters releases one target. | Corn Picker harvests a guarded target. |
| Weeds | Block kernels and grow every three accepted words, capped at two new weeds per level. | Harvest an orthogonal neighbor, including across the cylindrical seam. | Butter Brush clears one; Corn Picker also cuts weeds beside its harvest. |
| Web | Blocks a kernel until both marked anchor kernels have been harvested. | Harvest the anchor kernels in any order. | Butter Brush clears one web; Corn Picker can harvest anchors or its target. |
| Frost | Protects a kernel from harvesting while leaving its letter selectable. Later mixed levels have two ice layers. | Each accepted word using the letter removes one ice layer without harvesting that kernel. A later word harvests the thawed kernel. | Butter Brush removes all ice; Corn Picker harvests the kernel. |

## Fairness and persistence

Caterpillar time advances only during active play. Intro, pause, tools, recovery offers, developer menus, harvest/tool animations, unfocused screens, and app backgrounding stop the clock. There is no offline catch-up.

Eaten kernels expose underlying layers but earn no coins, harvest percentage, or layer-objective credit. A free regrow button restores eaten kernels without resetting harvested kernels. A free rescue is offered when obstacles or eaten kernels leave no spellable word; it restores eaten letters and removes remaining obstacles. This is a deadlock escape, not a guarantee that every arbitrary sequence of words completes the level.

Obstacle timers, ice strength, remaining anchors, weed growth, and eaten kernel IDs persist with the local run. Older obstacle saves inherit missing authored metadata.

## Validation

Run `npm test` and `npm run typecheck`. Focused regression tests cover clock/turn separation, staggered bites, exposed layers, harvest credit, recovery, crow return, squirrel release, weed seam adjacency and caps, web anchors including Picker use, frost layers, and save migration.

Device playtesting should tune the seconds limits and obstacle combinations for reading speed and rotation comfort. Existing transparent obstacle artwork is reused; countdowns, fading letters, ice counts, and anchor markers are native UI.
