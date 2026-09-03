# Word Maize — Playable Gameplay Prototype

Build the first playable prototype of **Word Maize**, a portrait-oriented Expo/React Native mobile word game.

This is NOT the full commercial app yet. Do not build the Shop, ads, purchases, world map, daily rewards, account system, backend, analytics, or full progression.

The purpose of this prototype is to prove that the core corn-cob word mechanic is fun and technically viable on an actual iOS/Android device.

## First: inspect the project

Before changing code:

1. Inspect the existing repository.
2. Inspect all generated Word Maize image assets.
3. Identify the actual filenames, dimensions, transparency, and folder locations.
4. Reuse the supplied assets rather than replacing them with generic placeholders when a suitable asset exists.
5. Determine whether this is already an Expo project.
6. If it is an existing Expo project, preserve its structure and dependencies where reasonable.
7. If the repository is empty/new, initialize an Expo app using TypeScript.

Do not rename or delete source assets unnecessarily.

Create an `AGENTS.md` describing the important game architecture and prototype constraints if one does not already exist.

---

# Technical direction

Prefer:

- Expo
- React Native
- TypeScript
- React Native Gesture Handler
- React Native Reanimated
- Expo Haptics

Use Expo Router only if the project already uses it or if routing is required.

Do NOT introduce a 3D engine such as Unity.

Do NOT use Three.js solely for the corn.

Do NOT add Skia unless standard React Native + Reanimated proves insufficient for the selection path or visual effects.

The corn should use a **2.5D cylindrical board illusion**, not true 3D.

Keep the gameplay engine separated from presentation.

Suggested organization:

```text
src/
  game/
    types.ts
    board.ts
    adjacency.ts
    selection.ts
    dictionary.ts
    harvest.ts
    rotation.ts
    powerups.ts

  components/
    CornCob/
      CornCob.tsx
      Kernel.tsx
      WordSelectionPath.tsx
    HarvestMeter.tsx
    ToolBelt.tsx
    CurrentWord.tsx
    DebugPanel.tsx

  screens/
    PrototypeGameScreen.tsx

  data/
    prototypeLevel.ts
    prototypeDictionary.ts
```

Adapt this to the existing project instead of forcing it blindly.

---

# Visual target

Use the approved Word Maize visual direction from the provided assets.

The screen should resemble the previously designed gameplay screen:

- blue/farm environment
- large corn cob in the center
- green husks
- dimensional yellow kernels
- readable dark letters
- wooden Level header
- basket / harvested indicator
- three farm-themed power-ups

Do not bake letters into images.

Letters, scores, percentages, level text and tool counts must be rendered dynamically.

The cob should occupy the majority of the screen.

Prioritize touchability and gameplay clarity over matching a screenshot pixel-for-pixel.

---

# Prototype level

Implement one test level.

Header:

**LEVEL 1**

Objective:

**Harvest 70% of the cob**

Start with approximately:

- 7–9 rows
- 8–12 columns around the circumference
- 24–36 currently available/playable kernels

The exact numbers should be adjustable.

The internal board must be cylindrical.

Column `0` and the last column are neighbors around the circumference.

Example model:

```ts
type KernelState = {
  id: string;
  row: number;
  column: number;
  letter: string;
  harvested: boolean;
  exposed: boolean;
  layer: number;
};
```

Improve the types where appropriate.

Do not tightly couple board coordinates to screen pixel coordinates.

---

# Important: corn presentation

Do not make the final visual look like a flat rectangular Scrabble board pasted on corn.

Use the supplied:

- cob base
- husks
- kernel sprites
- empty socket state
- selected kernel state

Individual kernel positions should visually conform to the corn shape.

Center kernels should appear:

- slightly wider/larger
- brighter
- facing the player

Kernels toward the cylindrical edges should progressively:

- compress horizontally
- scale down slightly
- darken slightly
- shift in perspective

The purpose is to create the illusion that the grid wraps around a cob.

Keep this transformation programmatic so it continues working when the board rotates.

---

# Kernel letters

Overlay letters with native text.

Requirements:

- large enough to read comfortably
- centered
- high contrast
- do not place letters into the PNG itself
- kernel touch area may be larger than its visible sprite

The invisible interaction target should be forgiving on phones.

---

# Word selection interaction

This is the highest-priority system.

Primary interaction:

**press kernel → hold → drag through adjacent kernels → release**

The player should NOT need pixel-perfect dragging.

Implement **magnetic directional snapping**.

When a kernel has been selected:

1. Determine its currently valid adjacent kernels.
2. Observe the user's drag vector.
3. Snap toward the most likely neighboring kernel based primarily on direction and distance.
4. Require enough movement before selecting another kernel.
5. Prevent tiny movements from accidentally selecting nearby letters.

Support 8-direction adjacency:

- up
- down
- left
- right
- four diagonals

Do not allow arbitrary jumps.

Do not allow the same kernel to appear twice within one active word.

---

# Selection feedback

When a kernel joins the active word:

- visually lift/scale it slightly
- use its selected state
- provide a subtle haptic tick
- draw a visible connection to the previous selected kernel
- append its letter to the current word shown above the cob

For example:

**HARVEST**

The connection/path should clearly show the sequence.

---

# Backtracking

Backtracking must be natural.

If the selected sequence is:

`H → A → R → S`

and the player drags back onto `R`:

- deselect `S`
- remove S from the word
- return S to normal state

The player should not need to restart the whole gesture.

---

# Word submission

Releasing the finger submits the currently selected word.

Minimum word length:

**3**

For the prototype, use a curated local dictionary.

It is acceptable to include a small test dictionary containing enough words to validate the mechanic.

Do not add an online API requirement.

## Valid word

When valid:

1. briefly emphasize the word
2. mark selected kernels harvested
3. play pop animations
4. animate loose kernels toward the basket
5. replace removed kernel positions with empty socket art
6. expose an underlying kernel when level data specifies one
7. update harvest percentage
8. clear active selection

Use supplied particle/flying-kernel art where appropriate.

## Invalid word

When invalid:

- subtle shake
- optional low-impact haptic
- clear the selection
- return kernels to normal

No modal.

No life penalty.

No intrusive error.

---

# Layered kernels

Support a limited second layer.

Some selected level positions should contain another kernel underneath.

Example:

```text
top kernel
   ↓ harvested

empty socket / transition
   ↓

underlying letter becomes exposed
```

Not every position needs multiple layers.

The test level should have enough layered positions to verify that the system works.

The board engine should support layer information without special-case UI hacks.

---

# Harvest meter

Track percentage of harvestable kernels removed.

Display:

**42% HARVESTED**

with the basket asset.

Prototype target:

**70%**

When the target is reached:

show a simple level-complete overlay:

**BUMPER CROP!**

**Level Complete**

Include:

- kernels harvested
- words found
- longest word

and a:

**PLAY AGAIN**

button.

For this prototype, Play Again resets the level.

Do not implement monetization here yet.

---

# Cob rotation

The corn must rotate horizontally.

Important gesture distinction:

### Start gesture on a playable kernel
Enter **word-selection mode**.

### Start horizontal gesture on an unused / non-letter part of the cob
Enter **rotation mode**.

This prevents ambiguity.

The user swipes left/right to rotate the cylindrical board.

Internally, rotation should be based on cylindrical column positions rather than swapping random letters.

As the cob rotates:

- visible columns move laterally
- kernels approaching edges compress
- columns disappear around one side
- new columns enter from the other side
- letters remain attached to their board positions

The board must wrap continuously around the circumference.

Rotation does NOT need to continue while a word is actively being selected.

Disable rotation during an active word trace.

Add mild snapping after rotation so the cob settles cleanly rather than stopping between unusable positions.

---

# Power-up tool belt

Show only three power-ups.

Use the generated assets.

Bottom gameplay area:

- Scarecrow
- Butter Brush
- Corn Picker

Give the test player a few of each.

Example:

```text
Scarecrow ×3
Butter Brush ×2
Corn Picker ×3
```

No coins.

No purchasing.

No ads.

These counts reset when the test level resets.

---

# Scarecrow behavior

Purpose:

**Tell me where to start.**

When tapped:

1. choose a valid currently discoverable word the player has not found
2. identify the first kernel of its path
3. make that kernel visibly pulse/glow
4. do NOT reveal the entire word

The player still solves the word.

Consume one Scarecrow.

---

# Butter Brush behavior

Purpose:

**Give me a stronger hint.**

When tapped:

1. choose an undiscovered valid word/path
2. reveal/highlight approximately its first 2–3 kernels in sequence
3. visually use a buttery highlight/path effect if practical
4. do not automatically harvest the word

Consume one Butter Brush.

---

# Corn Picker behavior

Purpose:

**Change the puzzle.**

Tap Corn Picker.

Enter picker mode.

Display:

**Pick one kernel**

The next eligible kernel the user taps:

- pops off the cob
- becomes harvested
- exposes its underlying kernel if one exists
- updates harvest progress

Consume one Corn Picker.

Allow cancelling picker mode.

---

# Gesture conflict priority

Explicitly establish gesture ownership.

Priority:

1. active power-up selection
2. active word trace
3. cob rotation
4. normal UI gestures

Avoid allowing multiple gesture systems to claim the same movement simultaneously.

---

# Debug/tuning panel

This is essential.

Create a developer-only collapsible panel.

Allow changing at runtime where practical:

- kernel visual size
- kernel touch-target multiplier
- magnetic snap sensitivity
- minimum movement threshold
- directional bias
- rotation sensitivity
- rotation snapping strength
- number of visible columns
- harvest target
- haptic on/off

Also show debug values such as:

- current selected kernel IDs
- current word
- cob rotation offset
- FPS if reasonably simple
- selected row/column

Do not show this panel in a production configuration.

---

# Performance

Target smooth performance on a physical iPhone and Android device.

Avoid rerendering the entire board for every pointer position.

Use appropriate memoization/shared animation values.

Keep gesture calculations lightweight.

Avoid huge uncompressed assets being repeatedly decoded.

Do not prematurely optimize at the expense of understandable code, but flag obvious performance issues.

---

# Corn varieties architecture

Only yellow corn needs to appear in the prototype.

However, do NOT hardcode the engine to yellow.

Prepare the visual/theme model for:

```ts
type CornVariety =
  | "yellow"
  | "red"
  | "white"
  | "purple"
  | "glass_gem";
```

A variety should be able to choose a different kernel asset family without changing gameplay logic.

Glass Gem will eventually allow different colors per kernel.

Do not implement all of these now unless the assets already make it trivial.

---

# No monetization yet

Do NOT implement:

- AdMob
- RevenueCat
- in-app purchases
- Shop
- paid power-ups
- Remove Ads
- rewarded ads
- coin currency

We will add those only after the gameplay mechanic is validated.

---

# No backend yet

Do not introduce Supabase, Firebase or a custom server for this prototype.

Store prototype state locally/in memory.

The game should work offline.

---

# Testing

Add unit tests for game logic that does not require rendering.

At minimum test:

### Adjacency
- horizontal
- vertical
- diagonal
- invalid jump
- cylindrical wrap between first/last columns

### Selection
- valid extension
- duplicate-kernel prevention
- backtracking

### Harvest
- kernel removal
- layered kernel exposure
- harvest percentage

### Dictionary
- valid word
- invalid word
- minimum length

### Rotation logic
- column wrap behavior

---

# Prototype acceptance criteria

Do not consider the task complete until all of these work:

1. App starts successfully with Expo.
2. One Word Maize level is immediately playable.
3. Generated art assets are visibly used.
4. Corn looks substantially cylindrical rather than like a flat rectangle.
5. Letters are readable.
6. Player can press and drag to form words.
7. Magnetic snapping makes selection forgiving.
8. Diagonal paths work.
9. Backtracking works.
10. Releasing submits the word.
11. Valid words harvest kernels.
12. Invalid words reset gracefully.
13. Removed kernels show empty sockets.
14. At least some removed kernels expose another letter underneath.
15. Harvest percentage updates.
16. Cob rotates left/right.
17. Rotation reveals different letters/columns.
18. Rotation does not interfere with word tracing.
19. Scarecrow works.
20. Butter Brush works.
21. Corn Picker works.
22. Haptics are used appropriately.
23. Reaching 70% shows Bumper Crop / Level Complete.
24. Play Again resets the prototype.
25. Debug controls allow gesture tuning.
26. Core game-engine tests pass.
27. TypeScript checks pass.
28. App has no obvious runtime errors.

---

# Work process

Work autonomously through implementation.

Do not stop after scaffolding files.

Run the app/build tooling and tests yourself.

Resolve TypeScript, Expo and runtime errors you encounter.

When a visual implementation choice is uncertain, prioritize:

1. usability
2. touch accuracy
3. gameplay feel
4. supplied Word Maize design direction
5. visual polish

Do not overbuild unrelated features.

At completion, provide:

1. concise summary of what was implemented
2. architecture overview
3. exact commands to run the prototype
4. controls/gestures
5. debug-panel instructions
6. tests performed
7. any known limitations
8. specific things I should evaluate on a physical phone

The most important question this prototype must answer is:

**Does rotating a corn cob, magnetically tracing words through kernels, and popping those kernels off feel fun and intuitive on a phone?**