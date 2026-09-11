Build a new World Maize mini-game called **Pop-a-Word**.

This should live inside **The Fair** as a fast arcade-style word game.

The mechanic is inspired by fruit-tapping/slicing games, but instead of fruit, **corn kernels with letters are launched upward from the bottom of the screen**. The player taps the correct lettered kernel to complete the word shown at the top.

Do not overengineer this. Keep it within the current app architecture and use lightweight animation rather than adding a full physics engine unless absolutely necessary.

CORE GAMEPLAY

At the top of the screen, show the current word progress.

Example:

HARVEST

H A R _ _ _ _

FIND: V

The current required letter should be very obvious.

The player must tap the correct lettered kernel before it falls off screen.

When the correct kernel is tapped:

1. kernel reacts immediately
2. kernel pops into popcorn
3. play a pop animation
4. emit a small burst of popcorn/crumb particles
5. trigger light haptic feedback if enabled
6. animate the letter toward the correct word slot if practical
7. fill the letter slot
8. advance to the next required letter
9. increase score/combo

Example:

HAR____
FIND: V

tap V

HARV___
FIND: E

Continue until the whole word is complete.

IMPORTANT VISUAL RULE

The LETTERS should primarily appear on the **unpopped corn kernels**.

The visual transformation should be:

lettered kernel
→ player taps
→ POP
→ popcorn burst
→ letter collected

Do not make the main collectible already look like popcorn before the player taps it.

PLAIN POPCORN

Plain popcorn can also fly through the scene as visual distraction.

Plain popcorn:
- has no letter
- should not be required
- can be safely ignored

Do not make the playfield overly crowded in early rounds.

SCREEN LAYOUT

Use the latest Pop-a-Word render as the visual reference.

TOP HUD

Keep the HUD compact.

Top-left:
- pause button

Top-center:
- wooden word board
- answer slots
- current target underneath

Example:

H A R _ _ _ _
FIND: V

Top-right:
- countdown timer

Keep the timer small enough that it does not dominate the screen.

Also show:
- score
- combo

These should be smaller secondary HUD elements.

Example:

Score
120

Combo x2

PLAYFIELD

The majority of the screen should be the actual gameplay area.

Target roughly:
- 12–15% top HUD
- 70–75% active playfield
- 10–12% launcher area

Do not waste a large amount of vertical space on the popcorn machine.

POPCORN LAUNCHER

At the bottom, show only a small launcher / popcorn bucket / machine.

The player should mostly see:
- top rim
- small red-and-white bucket/machine
- POP-A-WORD badge

The launcher should occupy approximately 10–12% of the screen height.

Do NOT build the huge machine from the earlier concept.

Objects can launch from slightly different horizontal positions near the bottom, not necessarily from one exact center point.

BACKGROUND

Use a World Maize county-fair setting.

Visual ideas:
- fair tents
- string lights
- barn
- corn fields
- fence
- ferris wheel
- sunny sky

However, the background should remain secondary.

Use blur, reduced contrast, darkening, or depth treatment if needed so the flying kernels remain easy to see.

Do not make the background interactable.

OBJECT TYPES

For the first prototype, support only:

1. LETTER KERNEL
- golden kernel
- large readable letter
- tappable

2. PLAIN KERNEL
- no letter
- distraction

3. POPCORN
- visual distraction / pop result

Do not add burnt kernels, bombs, powerups, hazards, or special items yet.

We can add those later after the core game feels good.

TRAJECTORY SYSTEM

Do not add a full physics engine for the first implementation.

Use deterministic projectile motion.

Each launched object can have:

- id
- type
- letter
- startX
- startY
- velocityX
- velocityY
- gravity
- rotation
- rotationSpeed
- scale
- state

Conceptually:

x = startX + velocityX * time

y = startY + velocityY * time + 0.5 * gravity * time^2

rotation = initialRotation + rotationSpeed * time

Objects should:
- launch upward
- follow natural arcs
- rotate slightly
- fall back down
- disappear once safely below the screen

Make the launch pattern feel lively but controlled.

Never create trajectories where the player has almost no chance to tap the object.

SPAWNING

Start simple.

Early prototype:
- 1–3 objects visible at once
- moderate launch speed
- predictable spacing

Spawn a mix of:
- current target letter
- incorrect letters
- plain kernels/popcorn

Ensure the required target letter appears frequently enough that the game does not feel unfair.

If the target falls off the screen, respawn it later.

Do not permanently fail the player just because one instance was missed.

TAP DETECTION

Make the touch target slightly larger than the actual kernel sprite.

This is important for mobile usability.

When an object is tapped:
- prevent double-taps from counting twice
- mark the object as resolving
- immediately show responsive feedback

CORRECT TAP

If the tapped kernel matches the current target letter:

- increment score
- increment combo
- play success feedback
- pop kernel into popcorn
- animate collected letter
- advance target index

WRONG LETTER

For the first version:
- do NOT end the game
- do NOT remove a life

Instead:
- small dull pop/bounce/shake
- reset or reduce combo
- optional small score penalty

Keep this forgiving while testing the mechanic.

PLAIN POPCORN TAP

If plain popcorn is tapped:
- small harmless pop/bounce
- optionally reset combo
- do not heavily punish

WORD COMPLETION

When all letters are collected:

1. freeze new launches briefly
2. show the completed word
3. celebratory popcorn burst
4. display:
   WORD COMPLETE!
5. award bonus points
6. move to next word or show results screen

For the first prototype, either:
- immediately load the next word
OR
- show a simple Next Word button

GAME SESSION

Build a short session lasting roughly 30–45 seconds.

Example:
- 5–8 words
- score accumulates
- combo accumulates

For now, use a simple timer.

When time reaches zero:
- stop spawning
- allow any currently resolving animation to finish
- show results

RESULTS SCREEN

Show:

POP-A-WORD COMPLETE

Score
Best Combo
Words Completed
Accuracy

Buttons:
- Play Again
- Back to Fair

Do not build rewards/economy integration yet unless the existing app already has a simple hook for it.

COMBO SYSTEM

Correct consecutive taps increase combo.

Example:
x1
x2
x3
x4

A wrong tap resets combo to x1.

Add subtle escalating visual feedback:
- text scale pulse
- brighter pop effect
- slightly stronger particles

Do not make the combo system mechanically complicated yet.

ANIMATION

Use lightweight animations.

Suggested effects:

Kernel launch:
- translate
- rotate
- slight scale variation

Correct tap:
- quick squash
- fast scale-up
- sprite/state swap to popcorn
- particle burst
- fade

Collected letter:
- animate from tapped object position toward target word slot

Wrong tap:
- quick shake or dim pulse

Word complete:
- answer tiles bounce sequentially
- popcorn burst

Respect Reduced Motion settings if the app already supports them.

SOUND / HAPTIC HOOKS

Add hooks/placeholders for:

- kernel launch
- small whoosh
- popcorn pop
- correct letter
- wrong tap
- combo increase
- word complete
- timer warning
- game complete

Use existing sound/haptic infrastructure if available.

Do not block implementation on final audio assets.

ART IMPLEMENTATION

Do NOT try to reproduce the whole render using CSS illustrations.

Use reusable image assets for:
- golden kernel
- popped popcorn
- popcorn particle
- launcher/bucket
- background scene

Use CSS / React Native layout and transforms for:
- HUD
- answer tiles
- timer
- score
- combo
- motion
- hitboxes
- particles
- pop effects

Suggested asset structure:

assets/fair/pop-a-word/
  background.png
  kernel.png
  popcorn.png
  popcorn-particle.png
  launcher.png

If those assets do not exist, use temporary placeholders that can be replaced later without changing game logic.

GAME DATA

Do not hardcode HARVEST as the only word.

Create a reusable word list/config.

Example:

[
  "CORN",
  "FARM",
  "MAIZE",
  "PLANT",
  "HARVEST",
  "FIELD",
  "SEED"
]

Game state should include:

currentWord
targetIndex
targetLetter
score
combo
timeRemaining
activeObjects
completedWords

The target should always be:

currentWord[targetIndex]

FAIR INTEGRATION

Add Pop-a-Word as a mini-game entry inside The Fair.

The Fair card should show:
- Pop-a-Word
- short description
- Play button

Example description:

Pop the right kernels and complete the word before time runs out.

Do not redesign the entire Fair in this task unless required for navigation.

FIRST PLAYABLE MILESTONE

The first milestone should be:

- open Pop-a-Word from The Fair
- word is CORN
- current target is C
- kernels launch in arcs
- some contain letters
- tap C
- it pops
- C fills the first slot
- target becomes O
- continue C → O → R → N
- word completion animation
- next word loads
- timer and score work

Once that is stable, add:
- combos
- more words
- more varied launch patterns
- results screen

DO NOT ADD YET

Do not add:
- burnt kernels
- bombs
- lives
- special powers
- purchases
- ads
- multiplayer
- leaderboards
- complex progression
- full rigid-body physics

Focus entirely on making the core tap/pop/collect loop feel responsive and satisfying.

The priority is:

1. responsive taps
2. readable letters
3. satisfying pop feedback
4. reliable trajectories
5. clear word progression
6. lots of usable screen space
7. consistent World Maize visual style