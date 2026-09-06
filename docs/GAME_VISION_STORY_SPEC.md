# Word Maize — Game Vision, Story, and Obstacle Specification

Status: historical design foundation. Current behavior is defined by `GAME_OVERVIEW.md`, `GAMEPLAY_SYSTEMS.md`, and `CAMPAIGN_CONTENT.md`.
Audience: Design, engineering, art, animation, audio, and narrative  
Authority: This document defines the intended player experience. Deterministic gameplay behavior remains implemented in `src/game`.

## 1. Game purpose

Word Maize is a friendly portrait mobile word puzzle about restoring a farming valley one harvest at a time.

The player searches a rotating, cylindrical field of lettered corn kernels, taps visible kernels in spelling order, and presses the assembled word to submit it. Valid words harvest those kernels into a basket, reveal sockets or deeper kernel layers, award coins, and advance the level objective.

The game should combine:

- The calm satisfaction of finding words
- The tactile pleasure of rotating and harvesting a dimensional cob
- Short strategic decisions created by visible farm obstacles
- A light story about restoring farms before the Harvest Festival
- A world that visibly improves as the player progresses

The game is not intended to be a stressful real-time word test. Its default campaign should reward observation and planning. Timed play belongs only in clearly labeled optional challenge levels.

## 2. Player fantasy

The player is the valley's newest **Word Harvester**. Words carry a small form of harvest magic: when the player discovers them, healthy kernels release from the cob and help restore the surrounding farm.

The player's long-term goal is to:

1. Restore neglected farms across the valley.
2. Protect crops from animals, insects, weeds, and weather.
3. Help Patch the scarecrow reunite the farming communities.
4. Gather enough harvests, tools, and festival decorations.
5. Save and open the annual Harvest Festival.

## 3. Core design principles

### Words come first

Obstacles must change how the player evaluates letters; they must not bury the word puzzle under unrelated action.

### Threats are readable and fair

Every obstacle must communicate:

- Which kernel or area it affects
- What will happen
- When it will happen
- How the player can respond without paying

### Campaign pressure is turn-based

Normal obstacles advance after accepted words or explicit player actions. Thinking time is not punished.

### Spending is optional

Every campaign level must be completable without a purchase. Tools provide convenience, recovery, and alternative strategies—not mandatory solutions.

### Progress should be visible

Completed levels restore crops, buildings, paths, bridges, lights, decorations, and characters on the world map.

### Story supports play

Narrative appears in short storybook moments. Normal levels should begin quickly and should not require long conversations.

## 4. Core gameplay loop

1. Enter a level and read one concise objective.
2. Rotate the cob to inspect visible letters.
3. Tap any visible, unharvested kernels in spelling order.
4. Press the word display to submit.
5. Valid words animate into the harvest basket.
6. Removed kernels leave matching sockets or reveal deeper layers.
7. Obstacles advance after accepted words.
8. Reach the required harvest or special objective.
9. Earn coins, stars, tools, story progress, and restoration progress.
10. Return to the map and see the valley improve.

Letters do not need to be adjacent. Selected letters remain selected while the player rotates the cob.

## 5. Story presentation

Word Maize uses a light storybook structure:

- Two or three dialogue cards at the start of each world
- One short tutorial line when a mechanic or obstacle first appears
- Occasional reactions during milestone levels
- A short illustrated ending after each world
- Environmental restoration on the world map
- A larger ending after the Harvest Festival finale

Avoid dialogue before every level.

### Tone

- Warm, playful, hopeful, and gently humorous
- Obstacles are mischievous farm problems, not frightening enemies
- Failure should feel recoverable
- Characters never shame the player for using hints or tools
- Language should be understandable to families without becoming childish

## 6. Main characters

### Patch

Patch is a young, expressive scarecrow and the player's main guide.

Role:

- Introduces mechanics and objectives
- Warns the player about obstacles
- Celebrates clever words and restored farms
- Provides continuity between worlds

Personality:

- Earnest, optimistic, slightly inexperienced
- Tries to look brave around crows
- Uses light farm-related humor sparingly

Visual requirements:

- Neutral/idle pose
- Speaking poses
- Pointing/tutorial pose
- Worried pose
- Celebrating pose
- Crow-frightened pose
- Small portrait expressions for dialogue

### Farmer May

Farmer May owns the first farm and represents the valley community.

Role:

- Welcomes the player
- Explains why the Harvest Festival matters
- Rewards the first completed harvest
- Reappears at major restoration milestones

### Rusty

Rusty is a friendly red tractor used primarily as a visual mascot.

Role:

- Appears on completion screens
- Delivers large rewards and restored materials
- May become a late-game whole-row power-up

Rusty does not need dialogue in the MVP.

## 7. Campaign structure

The planned first campaign contains 60 levels across four worlds. Production should complete and playtest Levels 1–20 before committing to all later obstacle art.

### World 1: Sweet Corn Fields — Levels 1–15

Story:

Patch discovers that Farmer May's fields are producing weak harvests. The player learns to release word magic from the corn, restore the first farm, and reopen the road toward Crow Creek.

Gameplay:

- Tapping and submitting
- Rotation
- Basket harvesting
- Longer-word rewards
- Layered kernels
- Optional star objectives

World ending:

The first barn and field are restored. A flock of crows is seen traveling toward the creek, establishing the next problem.

### World 2: Crow Creek — Levels 16–30

Story:

Crows and squirrels are taking advantage of the weakened farms. Patch must restore the old scarecrow posts and protect the harvest long enough to repair the creek bridge.

Gameplay:

- Caterpillars
- Scarecrow tool
- Crows
- Squirrels
- Rescue objectives
- Two-obstacle challenge levels

World ending:

The bridge reopens and the animals retreat. The player discovers that weeds and unusual weather are spreading from Orchard Hollow.

### World 3: Orchard Hollow — Levels 31–45

Story:

The orchard paths are overgrown and several farms have become isolated. The player clears the routes, restores the mill, and gathers supplies for the festival.

Gameplay:

- Weeds and locked kernels
- Special win conditions
- Limited-word challenges
- Golden kernels
- Drought and rain modifiers

World ending:

The mill restarts and festival supplies are ready, but a major storm approaches during the journey to the festival grounds.

### World 4: Moonlight Maize — Levels 46–60

Story:

The restored farms work together through the night to protect the final crop and prepare the Harvest Festival before the storm arrives.

Gameplay:

- Wind and night visibility
- Familiar obstacles in combinations
- Multi-stage objectives
- Festival challenge levels

World ending:

The valley lights up, the Harvest Festival opens, and Patch is recognized as its official guardian. Ongoing daily and seasonal harvests unlock.

## 8. Level progression

### Levels 1–3: First Harvest

- Teach tapping, backtracking, clearing, and submission
- Start with five visible columns
- No obstacles
- Target 40–50% rather than 70%
- Guarantee familiar farm words
- Award the first free Corn Picker

### Levels 4–6: Rotation

- Introduce rotation buttons, then horizontal dragging
- Keep selected letters while rotating
- Require at least one word using letters found on different sides

### Levels 7–9: Kernel layers

- Introduce a small number of second-layer kernels
- Show that an empty socket can reveal another playable kernel
- Add an optional objective for clearing layered positions

### Level 10: First Bumper Crop

- Rotation and layers together
- Target around 65%
- Larger reward and first major completion presentation

### Levels 11–13: Caterpillar introduction

- One caterpillar at a time
- Three accepted-word turns before a kernel is eaten
- First encounter guarantees an easy rescue word

### Levels 14–15: Tool strategy

- Introduce Butter Brush as an obstacle counter
- Let the player solve with a word or a tool
- World 1 finale previews the crow

### Levels 16–19: Crow Creek

- Introduce predictable crow attacks
- Display attacks as “2 WORDS” and then “1 WORD”
- Teach Scarecrow protection

### Level 20: First combined challenge

- One caterpillar and one crow
- No real-time countdown
- Generous harvest target and tool reward

### Levels 21–24: Squirrel rescue

- Targeted theft with two or three accepted-word turns
- Rescue by using the targeted letter

### Levels 25–29: Weeds

- Covered kernels cannot be selected
- Clearly defined clearing condition
- Butter Brush provides an alternate solution

### Level 30: Crow Creek finale

- Two obstacle families
- Repair-the-bridge story objective
- World completion chest

### Levels 31–45: Objective and weather expansion

- Four-letter minimum levels
- Rescue a specified number of kernels
- Harvest an entire row
- Earn a target number of coins
- Find a six-letter word
- Drought, rain, and golden kernels

### Levels 46–60: Mastery

- Wind rotation after accepted words
- Night visibility and Lantern assistance
- Multi-stage festival objectives
- No more than two simultaneous obstacle families in a normal level
- Level 60 combines familiar mechanics in several readable phases

## 9. Obstacle specifications

### Caterpillar

Player-facing behavior:

- Occupies one visible kernel
- Advances through three bite stages after accepted words
- Is defeated when the player submits a valid word containing that kernel
- Eats the kernel if its final stage completes

Counterplay:

- Use the affected letter in a valid word
- Use Butter Brush to clear it

Required graphics:

- Crawl-in
- Idle/chewing loop
- Three bite states
- Startled reaction
- Defeated exit
- Bite particles and contact shadow

### Crow

Player-facing behavior:

- Circles above the play area
- Selects a target and casts a visible shadow
- Attacks after a stated number of accepted words
- Damages or removes its target

Counterplay:

- Harvest the targeted kernel first
- Use Scarecrow to block the attack

Required graphics:

- Distant circling loop
- Moving ground shadow
- Target warning
- Dive and grab
- Scared-away exit
- Feather particles

### Squirrel

Player-facing behavior:

- Runs beside a targeted kernel
- Tries to pull it free for two or three accepted-word turns
- Steals it if the player does not respond

Counterplay:

- Use the targeted kernel in a valid word
- Use Scarecrow
- Harvest it immediately with Corn Picker

Required graphics:

- Run-in
- Idle
- Pulling loop
- Kernel-carry pose
- Startled reaction
- Escape and dust particles

### Weeds

Player-facing behavior:

- Grow around a clearly marked group of kernels
- Fully covered kernels cannot be selected
- Growth advances by accepted words

Counterplay:

- Complete the level-specific clearing condition
- Use Butter Brush
- Use the future Hoe tool

Required graphics:

- Sprout, medium, and fully grown states
- Damaged state
- Clear animation
- Leaf particles

### Weather modifiers

Weather affects a whole level and is introduced after the player understands individual obstacles.

- Wind: rotates the cob slightly after accepted words
- Rain: creates bonus fresh kernels and extra coins
- Drought: gives selected kernels a limited number of turns
- Fog: reduces visibility away from the center
- Night: reduces visibility until the player rotates a letter forward

Weather must be declared before the level begins.

## 10. Power-ups and obstacle counters

### Scarecrow

Core use:

- Highlights the starting kernel of a useful word

Obstacle use:

- Blocks the next crow attack
- Scares away one squirrel

### Butter Brush

Core use:

- Reveals a valid word path

Obstacle use:

- Removes a caterpillar
- Clears one weed cluster

### Corn Picker

Core use:

- Immediately harvests one selected kernel

Obstacle use:

- Saves a threatened kernel
- Removes an inconvenient letter

### Future tools

Do not build these for the initial MVP:

- Lantern: improves visibility during night levels
- Watering Can: restores drought-damaged kernels
- Hoe: clears a weed-covered row
- Seed Bag: refreshes several exposed letters
- Tractor: clears or refreshes an entire row

## 11. Earned rewards

Players can earn:

- Coins for accepted words
- Longer-word bonuses
- Consecutive-valid-word bonuses
- Level stars
- Tool charges
- Daily Harvest rewards
- World-completion chests
- Obstacle rescue bonuses
- Perfect Harvest bonuses
- Golden kernels
- Cosmetic seed tokens

Golden kernels may appear after a five-letter word and award bonus coins when used in the next valid word.

## 12. Purchases and monetization boundaries

Appropriate purchases:

- Ad-free upgrade
- Clearly priced tool bundles
- Starter bundle
- Optional coin bundles
- Optional energy refill
- Cosmetic kernel varieties
- Basket skins
- Farm and seasonal themes

Rewarded ads may provide:

- One emergency obstacle counter
- A retry without spending energy
- Double completion coins
- One tool charge

Prohibited design patterns:

- Campaign levels that require payment
- Artificially aggressive obstacles intended to consume paid tools
- Random paid loot boxes
- Unlabeled real-time purchase pressure
- Purchase prompts after every failure

## 13. Star objectives

Each level has one required objective and up to two optional star objectives.

Examples:

- Complete the harvest target
- Lose no kernels
- Use no tools
- Find a five-letter word
- Rescue three threatened kernels
- Finish within a specified number of accepted words
- Earn a target number of coins
- Clear all layered positions

Stars unlock map rewards and optional chests. One star is sufficient to progress.

## 14. Art and animation inventory

### Core gameplay

- Full kernel
- Selected kernel silhouette glow
- Hint treatment
- Empty socket
- Golden kernel
- Brittle kernel
- Protected-kernel effect
- Kernel-to-basket animation
- Basket impact and sparkle
- Layer reveal

### Characters and obstacles

- Patch pose and portrait set
- Farmer May pose and portrait set
- Rusty tractor completion poses
- Caterpillar state set
- Crow state set and shadow
- Squirrel state set
- Weed growth set

### UI

- Story dialogue cards
- World title cards
- Objective panel
- Threat-turn counter
- Target marker
- Warning banner
- Star objectives
- Combo display
- Tool tutorial cards
- Level-complete and failure panels
- World-complete chest

### Environments

- Sweet Corn Fields gameplay background and map states
- Crow Creek gameplay background and map states
- Orchard Hollow gameplay background and map states
- Moonlight Maize gameplay background and map states
- Restored and unrestored landmarks
- Weather overlays
- Festival decorations and finale scene

## 15. Audio requirements

MVP:

- Kernel tap
- Backtrack
- Valid word
- Invalid word
- Kernel release/spin
- Basket landing
- Coin reward
- Cob rotation
- Layer reveal
- Level complete
- Light farm ambience
- One gameplay music loop

Obstacle expansion:

- Caterpillar chewing/startled sounds
- Crow call, wing pass, and dive
- Squirrel chatter and escape
- Weed growth/clearing
- Wind, rain, and night ambience

## 16. MVP scope

The first production milestone includes:

- One polished Level 1
- Tap-to-build word selection
- Press-word-to-submit behavior
- Cylindrical rotation with momentum and snap
- Matching kernel/socket artwork
- Layer reveal
- Kernel-to-basket harvesting
- Harvest meter
- Valid and invalid feedback
- Coins and one completion screen
- Local persistence
- Existing three power-ups
- Tutorial presentation

The first playable campaign milestone includes:

- Levels 1–10
- One complete world-map segment
- Tuned difficulty progression
- Layer tutorial
- Star objectives
- World 1 story introduction and ending
- Patch's core pose set

The first obstacle milestone includes:

- Levels 11–20
- Caterpillar
- Crow
- Turn-based threat engine
- Obstacle tutorials
- Scarecrow and Butter Brush counters

Squirrel, weeds, weather, and later worlds remain planned until the first 20 levels have been playtested.

## 17. Acceptance criteria

The game direction is successful when:

- New players understand the core interaction within the first level.
- A normal level begins within a few seconds.
- Rotation feels tactile and never causes columns to pop visibly.
- Every harvested kernel leaves a convincing socket or reveals another layer.
- Every obstacle can be understood without reading a long explanation.
- Players can counter every campaign obstacle without purchasing anything.
- Difficulty comes from decisions and board state, not obscure vocabulary alone.
- World progression visibly restores the valley.
- Story moments add motivation without interrupting repeated play.
- The first ten levels remain enjoyable before any obstacle is introduced.

## 18. Next production steps

1. Tune Level 1 to a 40–50% harvest target and verify first-session duration.
2. Author exact board data, guaranteed words, rewards, and star objectives for Levels 1–10.
3. Create Patch's visual development sheet and core pose set.
4. Build the Sweet Corn Fields story introduction and world-ending cards.
5. Playtest Levels 1–10 before producing obstacle animation sets.
6. Specify and prototype the caterpillar as the first obstacle.
7. Add the crow only after caterpillar counterplay is proven enjoyable.
