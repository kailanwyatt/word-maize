# Word Maize — Tap-to-Build Word Interaction

The game no longer uses drag tracing or magnetic selection.

Players build words by tapping individual visible kernels in sequence, then press the completed word display to submit it.

## Kernel selection

When the player taps an eligible kernel:

1. Add that kernel to the current selection.
2. Append its letter to the word display.
3. Highlight the kernel bright green.
4. Draw a glowing connection between it and the previously selected kernel.
5. Provide light haptic feedback.

A selectable kernel must:

- Be unharvested.
- Be on the visible, front-facing portion of the cob.
- Be adjacent to the previously selected kernel, except for the first letter.
- Not already appear in the current word, except through backtracking.
- Pass raycast visibility so kernels cannot be selected through the cob.

Adjacency includes:

- Horizontal neighbors.
- Vertical neighbors.
- Diagonal neighbors.
- Neighbors across the cylindrical first/last-column seam.

Rotation never changes logical row, column, identity or adjacency.

## Backtracking and correction

If the player taps the most recently selected kernel, remove it from the word.

If the player taps the kernel immediately preceding the most recent kernel, backtrack by removing the current final kernel.

Tapping a selected kernel from earlier in the path should trim the word back to that kernel.

Tapping a nonadjacent, harvested, hidden or otherwise invalid kernel should:

- Leave the current word unchanged.
- Give brief visual feedback.
- Optionally provide a subtle warning haptic.

Also provide a clear button near the word display to cancel the complete selection.

## Word display and submission

Show the current word in a prominent button above the cob.

States:

- No selection: show `TAP KERNELS TO BUILD A WORD`.
- Building: display the selected letters as one uppercase word.
- Ready: make the word button visibly pressable.
- Valid result: briefly turn green before harvesting.
- Invalid result: flash red and shake.

The player submits by tapping the word button.

Do not submit when the player taps the final kernel. Do not submit automatically after a delay.

Disable submission when:

- No kernels are selected.
- The current word is shorter than the configured minimum word length.
- A validation request is already running.
- A harvest animation is active.

## Valid submission

When the player presses the word button and the word is valid:

1. Lock selection temporarily.
2. Pulse the selected kernels green.
3. Animate the selected kernels outward from the cob.
4. Move or drop them toward the harvest basket.
5. Hide the kernel meshes and attached letters.
6. Reveal the matching recessed sockets.
7. Update the harvest percentage, score and basket.
8. Clear the selected path.
9. Restore the word display to its idle message.

## Invalid submission

When the submitted word is invalid:

1. Flash the word button red.
2. Shake the word display.
3. Briefly tint the selected kernels red.
4. Provide an error haptic.
5. Keep the kernels on the cob.

After the feedback, either preserve the current selection for correction or clear it according to the existing game design. Prefer preserving it and provide the clear button.

## Cob rotation

Horizontal dragging on empty space rotates the cob.

A short tap on a kernel selects it. A deliberate horizontal drag rotates the cob.

Use a movement threshold to distinguish a tap from a rotation gesture:

- Pointer movement below the threshold: treat as a tap.
- Horizontal movement above the threshold: begin rotation.
- Once rotation begins, do not select a kernel when the pointer is released.

Rotation may start even if a word is partially built, but it must preserve the selected path and highlights.

Selected kernels that rotate out of view remain part of the current word. They cannot be tapped again until they return to the selectable front-facing area.

## Remove obsolete behavior

Delete or disable all gameplay behavior associated with:

- Magnetic drag selection.
- Continuous pointer tracing across kernels.
- Selecting multiple letters during one pointer gesture.
- Submitting on pointer release.
- Automatically submitting when a path ends.
- Disabling rotation for the entire duration of a partially built word.

## Revised components

Use responsibilities similar to:

- `useKernelTapSelection`
- `useCobRotation`
- `TapGestureArbitrator`
- `SelectedKernelPath`
- `WordSubmitButton`

Do not retain both the old drag-selection system and the new tap system.

## Revised tests

Add tests for:

- First-kernel selection.
- Tapping an adjacent kernel.
- Rejecting a nonadjacent kernel.
- Rejecting a hidden or harvested kernel.
- Preventing duplicate selection.
- Tapping the final kernel to undo it.
- Tapping an earlier selected kernel to trim the path.
- Cylindrical seam adjacency.
- Tap-versus-drag gesture thresholds.
- Pressing the word display to submit.
- Preventing short-word submission.
- Valid submission and harvesting.
- Invalid submission without harvesting.
- Selection persistence during cob rotation.

## Updated definition of done

The interaction is complete when:

- The player taps visible adjacent kernels one at a time.
- Each tap adds one letter to the word.
- Selected kernels and their connections remain clearly highlighted.
- The word is submitted only by pressing the word display.
- Backtracking and clearing work.
- Horizontal dragging rotates the cob without accidental taps.
- Selection survives rotation.
- Valid words reveal matching sockets.
- Invalid words do not remove kernels.
- No magnetic drag-selection behavior remains.