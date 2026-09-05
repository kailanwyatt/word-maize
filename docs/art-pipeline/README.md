# Word Maize 3D art handoff

This package replaces the prototype's flat artwork with modular 3D assets without changing its working game rules.

## Authoritative runtime contract

- Levels use 7 rows and 8, 9, or 10 columns.
- Rotation is measured in column units; degrees per column is `360 / columns`.
- Column zero wraps to the final column.
- Players tap any visible kernel in spelling order. Adjacency is **not** required.
- The word-display button submits the word.
- Horizontal dragging rotates the cob.
- A harvested full kernel and its letter disappear; its matching socket remains.
- Letters and HUD remain app-rendered, never baked into Blender textures.

## Generate the starter models

Open `tools/blender/generate_word_maize_assets.py` in Blender's Scripting workspace and press **Run Script**, or run:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python tools/blender/generate_word_maize_assets.py
```

Outputs appear in `assets/word-maize/models/`:

- `word-maize-cob-review.blend`
- `kernel.glb`
- `socket.glb`
- `cob-body.glb`
- `cob-decoration.glb`
- `word-maize-models.json`

## Approval gate

The generator creates a technically aligned starter, not final character art. Refine the source objects while preserving their names, dimensions, origins, and axes.

Approve one kernel/socket unit before integrating the full cob:

1. `Kernel` completely covers `Socket` from front, 30°, 60°, and 90° views.
2. The removed state is a deep rounded-square cavity with no background leak.
3. Local `-Y` points outward from the cob and `+Z` points up.
4. `LetterAnchor` sits just beyond the kernel face.
5. Several adjacent removed kernels still look like a solid cob.
6. Side kernels narrow naturally during rotation.

## Integration order

1. Isolated kernel + socket + letter test inside the app.
2. Kernel instances across actual level rows/columns.
3. Socket instances and harvested-state reveal.
4. Cob body.
5. Husks and silk.
6. Materials, lighting, and responsive camera.
7. Selection glow and harvest effects.
8. Test 8-, 9-, and 10-column levels on web and a physical phone.

Reuse geometry/materials, keep the WebGL canvas transparent, and retain the existing PNG renderer behind a temporary development flag until the 3D path is approved.
