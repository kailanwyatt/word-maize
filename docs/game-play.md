Update the current World Maize gameplay screen to match the latest simplified visual direction.

Important: do NOT try to reproduce a cinematic/isometric illustrated scene. Keep this within the scope of the current app architecture: mostly reusable image assets, CSS / React Native layout, simple overlays, and lightweight animation.

The goal is to make the existing maze gameplay look polished while keeping the implementation practical.

REFERENCE DIRECTION

Use the latest rendered gameplay concept as the visual target:
- top-down / orthographic 2D maze
- dense corn walls
- dirt-path corridors
- farmer centered in the playable area
- wooden HUD panels
- large readable current target
- simple landmark props
- interactive corn-cob plants
- joystick lower-left
- harvest button lower-right

Do not introduce a pseudo-3D camera or perspective system.

CORE LAYOUT

Top-left:
- pause button

Top-center:
- wooden word panel
- display target word, e.g. CORN
- beneath it show the current answer slots
- beneath that show:
  FIND: C
- make the current target letter visually dominant

Top-right:
- map button

Below/top-left or integrated into HUD:
- harvested counter:
  0 / 4
  HARVESTED

Do not permanently display Sunny Acres / Chapter 1 if it creates clutter. That information can appear briefly when the level starts.

MAIN GAME AREA

The maze should fill most of the screen.

Keep the existing grid-based maze engine.

Improve the visual treatment of the maze without changing the underlying gameplay architecture.

Use:
- corn-wall tiles
- dirt-path background
- player sprite
- interactive corn plants
- a few landmark decorations

The player should not see large amounts of empty screen around the maze.

Slightly increase camera zoom compared with the current implementation so the farmer feels more embedded in the cornfield.

CORN WALLS

Current corn walls look too small and shrub-like.

Update them so they read as tall maize/corn.

The maze-wall corn should:
- be visually taller
- have stronger vertical stalk shapes
- include tassels
- slightly overlap the path edges
- cast subtle shadows onto the dirt
- vary slightly between tiles

Use approximately 3–4 reusable corn tile variants rather than generating unique art for every maze cell.

Randomly rotate/flip/select variants where appropriate to reduce visible repetition.

Do not make the wall geometry irregular enough to break collision readability.

PATHS

Keep the dirt path as a reusable texture.

Add subtle visual variation using lightweight overlays:
- footprints
- small stones
- occasional weeds
- dry leaves

Do not make these collision objects.

INTERACTIVE LETTER PLANTS

Interactive letter plants must NOT look like giant permanent cobs.

Create/use the following visual states:

1. UNSEEN
- normal-looking closed husk
- should blend into the surrounding corn
- no visible letter

2. REVEALED
- husk opens
- yellow corn cob visible
- letter appears directly on the cob
- do not float the letter above the plant

3. INSPECTED
- husk is closed again
- slightly peeled/disturbed appearance
- no visible letter
- player can recognize that they have already inspected it

4. HARVESTED
- cob removed
- empty / damaged stalk or cleared plant state

The memory mechanic depends on these states.

LETTER REVEAL

When the farmer enters the interaction radius of a hidden letter plant:

- slightly scale/bounce the plant
- rustle the leaves
- open the husk
- reveal the letter
- keep the letter visible briefly
- if not harvested, close the husk again
- transition it to INSPECTED state

Do not require the player to press HARVEST just to inspect a plant.

Reveal should happen automatically from proximity.

HARVEST BUTTON

Bottom-right.

Default state:
- lower opacity / visually inactive

When the player is close enough to an interactive plant:
- increase opacity
- subtle glow

When the currently revealed plant contains the correct target letter:
- make the Harvest button clearly active
- add a subtle pulse

When pressed on the correct letter:
- play harvest animation
- remove the cob
- animate the letter toward the word HUD if practical
- fill the next answer slot
- advance the target letter

Do not punish the player for revealing a wrong/non-target letter.

A wrong letter is information, not a mistake.

PLAYER

Keep the existing farmer sprite / character.

Improve:
- scale consistency relative to corn
- centered camera tracking
- soft ground shadow
- subtle footsteps while moving if easy to implement

Do not make the player tiny compared with interactable plants.

LANDMARKS

Add only a small number of reusable landmark sprites.

For Sunny Acres, start with:
- rock
- signpost
- sunflower patch
- scarecrow

These should:
- help the player remember locations
- sit near paths
- not block movement unless intentionally configured as collision objects

Do not fill the maze with decorative props.

The purpose is spatial memory.

Example:
“The P was near the scarecrow.”

CAMERA

Keep the camera orthographic/top-down.

Follow the player.

Aim to show enough maze to understand nearby branches, but not the entire level.

Avoid the huge zoomed-out view currently visible.

The maze should feel larger than one screen.

HUD CLEANUP

Reduce HUD footprint.

Do not stack multiple large wooden panels across the entire top.

Use:
- one primary word/objective panel
- small harvested counter
- pause
- map

Keep roughly 80%+ of the screen focused on gameplay.

Remove the timer from Sunny Acres if this level is not timed.

Timer should only appear for modes/chapters where speed matters.

VISUAL STYLE

Use the current World Maize style:
- warm wood
- green corn
- golden/yellow accents
- rounded UI
- slightly cartoon/3D rendered sprites
- clean, readable typography

Avoid:
- photorealism
- flat debug-looking blocks
- overly ornate HUD
- giant decorative corn cobs
- cinematic background scenes inside gameplay
- expensive full-scene illustration rendering

IMPLEMENTATION STRATEGY

Build this from reusable pieces.

Prefer:
- CSS / React Native layout for HUD
- image sprites for farmer/corn/props
- transforms / opacity / scale for animation
- reusable tile variants
- state-driven rendering for letter plants

Do not attempt to generate the environment procedurally with CSS artwork.

If new visual assets are needed, structure the code so assets can be dropped in later without changing the game logic.

Suggested asset structure:

assets/gameplay/sunny-acres/
  corn-wall-01.png
  corn-wall-02.png
  corn-wall-03.png
  corn-wall-04.png
  path-texture.png
  letter-plant-closed.png
  letter-plant-revealed.png
  letter-plant-inspected.png
  letter-plant-harvested.png
  rock.png
  signpost.png
  sunflowers.png
  scarecrow.png

Use existing assets where possible before creating placeholders.

GAMEPLAY LOGIC MUST REMAIN DATA-DRIVEN

Do not hard-code CORN.

The same UI should work for any word.

Example:

word = "APPLE"

targetIndex = 0

targetLetter = word[targetIndex]

harvestedLetters = []

Each successful harvest:
- append/fill letter
- increment targetIndex
- update FIND target
- complete puzzle when targetIndex reaches word length

DELIVERABLE

Update the current Sunny Acres gameplay screen so it feels like a polished 2D mobile game built from reusable sprites.

Focus specifically on:
1. improved corn wall scale
2. tighter camera framing
3. cleaner HUD
4. proper hidden/revealed/inspected/harvested plant states
5. automatic proximity reveal
6. better Harvest-button states
7. a few visual landmarks
8. consistent sprite scale
9. maintaining current maze-generation and movement logic

Do not expand into fog, storm, wildlife, chapter progression, or new game modes in this task.

Treat this as the polished visual and interaction pass for the core Sunny Acres maze experience.