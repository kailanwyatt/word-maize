# Word Maize — Gameplay Systems

Status: authoritative gameplay specification for the current MVP

## One level

1. Read the goal and any one-time mechanic introduction.
2. Rotate the cob horizontally to inspect visible letters.
3. Tap visible, exposed kernels in spelling order. Kernels do not need to be neighbors.
4. Tap a selected kernel again to backtrack to that point, or clear the word display.
5. Press the word display to submit.
6. A valid word awards word coins and harvests affected kernels. An invalid word remains on the cob and gives clear feedback.
7. Harvested positions expose a socket or the next unharvested layer.
8. Obstacles and weather advance according to their deterministic turn rules.
9. Complete the main objective, receive 1–3 stars and rewards, then continue to the map or next Endless cob.

Selected letters remain selected while the cob rotates. Tool mode takes priority over selection and rotation actions.

## Cylindrical board

- Column zero is adjacent to the final column in game logic.
- Only the first unharvested layer at a row/column position is exposed.
- Visibility is calculated from rotation; edge kernels receive perspective scale, horizontal compression, shade, and directional tilt.
- Side perspective is produced in code. There are no separate left/right kernel sprites.
- Native text stays attached to its kernel transform so letters remain aligned during rotation.

## Completion and stars

Every level has a primary objective, usually a harvest percentage combined with a minimum word count, longest word, or layer-reveal requirement. Completing the primary objective clears the level. Two additional star goals reward stronger play such as a longer word, no tools, more harvested layers, or a higher percentage.

Coins come from accepted words, the level reward, performance, first clear, weather or Golden Corn bonuses, and an optional rewarded-ad multiplier. Replay rewards do not repeat the first-clear bonus.

## Corn varieties

- **Sweet Corn, Levels 1–12:** standard glossy gold kernels and foundational play.
- **White Corn, Levels 13–20:** dormant kernels wake when an orthogonally adjacent cylindrical neighbor is harvested.
- **Flint Corn, Levels 21–30:** armored kernels crack on their first accepted use and harvest on their second.
- **Popcorn, Levels 31–40:** marked kernels charge after valid words; at three charges they pop themselves and the next cylindrical neighbor. Invalid submissions reduce charge by one.
- **Blue Corn, Levels 41–50:** moonlit letters are veiled on the sides and become readable near the center or through a reveal tool.
- **Golden Corn, Levels 51–60:** festival kernels pay bonus coins when included in valid words of five or more letters.

Every variety preserves the approved Sweet Corn canvas, silhouette, alpha footprint, lighting direction, and socket fit.

## Obstacles

Obstacles are states attached to specific kernels, not random art floating over the board. Their state is saved with an active run.

- **Caterpillar:** occupies and threatens a readable kernel; Butter Brush clears it.
- **Crow:** threatens a kernel after accepted turns; Scarecrow counters it.
- **Squirrel:** creates a use-it-before-it-is-gone pressure state.
- **Weed:** wraps a kernel in a matching vine treatment and blocks it until cleared.
- **Spider web:** binds a group of letters until broken.
- **Frost:** overlays a frozen state; direct interaction cracks it and Butter Brush can clear it.

Obstacle timing is turn-based in the campaign. Players may always solve without making an in-app purchase.

## Weather

- **Rain:** visual rain and bonus feedback reinforce stronger harvests.
- **Wind:** gusts rotate the cob after configured accepted-word intervals.
- **Drought:** longer words break the dry spell and earn the intended bonus.
- **Storm:** combines storm presentation with stronger forced rotation events.

Weather feedback uses animation, text, sound, and haptics where enabled. Reduced Motion shortens or removes nonessential movement.

## Tools

- **Scarecrow:** clears a crow or highlights the starting kernel of a discoverable word.
- **Butter Brush:** clears compatible obstacles or reveals a full discoverable word path.
- **Corn Picker:** switches to a targeted mode and removes one chosen visible kernel.

Tools are earned, bought with real money through bundles, or optionally obtained through rewarded ads. They are convenience and recovery mechanics, never required solutions.

## Economy and energy

Campaign attempts cost one energy unless resuming an already saved level. Energy replenishes locally over time and can be supplemented by a rewarded ad. Coins and inventory persist locally. The store offers an ad-free entitlement and tool bundles through RevenueCat when native services are available.

## Accessibility and feedback

Touch targets are larger than the visible kernel where possible. Meaningful states use shape, pattern, and contrast in addition to color. Settings cover music, sound effects, haptics, notification preference, and Reduced Motion. Native letters and accessibility labels identify row, column, and state.
