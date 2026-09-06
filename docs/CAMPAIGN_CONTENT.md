# Word Maize — Campaign and Content

Status: authoritative structure; exact per-level tuning remains data-driven in `src/data/levels.ts`

## Campaign shape

The campaign has 60 authored, validated levels in four 15-level map chapters. A chapter is a continuous illustrated scene with its level nodes aligned to the visible trail. Reaching the chapter exit presents a named transition into the next scenery rather than pretending unrelated map paintings form one continuous image.

## Worlds and progression

### Levels 1–15 — Sweet Corn Fields

Teach tapping, submission, rotation, the basket, layered positions, star goals, and basic tools. Sweet Corn is used through Level 12; White Corn begins at Level 13 as a bridge into planning order. The farm and road are restored.

### Levels 16–30 — Crow Creek

Develop White Corn neighbor reveals, then introduce multicolor Flint Corn and its two-hit armored kernels. Animal pressure and paired obstacle challenges become more frequent. The creek bridge and scarecrow posts are restored.

### Levels 31–45 — Orchard Hollow

Popcorn adds charge and chain-pop decisions. Weeds, webs, drought, and rain create board-state planning. Blue Corn begins at Level 41 and introduces center-band visibility. The orchard routes and mill are restored.

### Levels 46–60 — Moonlight Maize

Blue Corn, wind, storms, and learned obstacles combine before Golden Corn arrives at Level 51. Festival kernels reward long-word mastery. The finale opens the Harvest Festival and unlocks Endless Harvest.

## Difficulty curve

- Harvest targets, minimum word lengths, and objective combinations rise gradually.
- Each new rule first appears with a short tutorial and a forgiving board.
- Normal levels introduce at most one new variety rule alongside one familiar obstacle or weather family.
- Later levels combine learned systems instead of adding hidden exceptions.
- Every authored level contains guaranteed words and passes automated validation.
- Variety-mechanic density increases within its level range, then stabilizes.

The exact goals and mechanic counts are defined by Level records in `src/data/levels.ts` and deterministic helpers in `src/game`.

## Map and restoration

Completed levels record stars and unlock the next node. Players can scroll each large chapter map to revisit past nodes and inspect upcoming ones. Chapter selection provides natural movement between distinct scenery. Restoration milestones change farm presentation and grant one-time local rewards.

## Endless Harvest

Completion of Level 60 unlocks an Endless Harvest card on the Play screen.

- Starting a run creates and saves a seed.
- Leaving gameplay preserves the active cob and stage.
- Completing a cob pays its reward, records the best stage, advances the saved stage, and opens the next cob.
- Corn varieties cycle Sweet, White, Flint, Popcorn, Blue, and Golden.
- A validated authored template of the correct variety is deterministically selected and shuffled.
- Harvest target begins at 58%, rises by 2 points every three stages, and caps at 86%.
- Longest-word expectations rise gradually to eight letters.
- The current MVP run continues until the player chooses to end it; a separate failure and leaderboard system is post-MVP.

## Content authoring rules

New levels must declare their corn type, objective, two star goals, reward, guaranteed words, tutorial or story when needed, weather, obstacle definitions, hint paths, and kernel layers. Run the automated suite after every board change. Art never determines rules; it only visualizes data-owned state.
