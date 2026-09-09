# Missing Word Maize assets

Working inventory of raster gaps. Letters and HUD stay native. Magenta `#FF00FF` backgrounds are for knockout only; shipped sprites use genuine alpha.

Style: polished casual 3D farm art (Hay Day / Homescapes family). Warm gold, leaf green, barn red, cream, sky blue. No baked words, numbers, logos, or UI chrome.

Status: **created and wired** 2026-09-08. Magenta sprites were keyed to alpha via `tools/art/import-missing-assets.mjs`.

| ID | Destination | Size | Alpha | Screen | Status |
| --- | --- | --- | --- | --- | --- |
| MW-023 | `assets/word-maize/maze/open-v4.png` | 256² | yes | Maze peek cob | wired |
| MW-022 | `assets/word-maize/maze/closed-letter-v1.png` | 256² | yes | Maze uninspected letter plant | wired |
| MW-021 | `assets/word-maize/ui/chapter-thumb-01.png` … `08.png` | square | no | Chapters list | wired |
| MW-013 | `assets/word-maize/backgrounds/home-hero-v1.jpg` | 9:16 | no | Play backdrop | wired |
| MW-014 | `assets/word-maize/characters/home-farmer-idle.png` | ~3:4 | yes | Play farmer host | wired |
| MW-015 | `assets/word-maize/ui/home-continue-thumb.png` | 4:3 | no | Continue Maize card | wired |
| MW-016 | `assets/word-maize/ui/home-world-map-thumb.png` | 4:3 | no | Chapters card | wired |
| MW-017 | `assets/word-maize/ui/home-world-thumb.png` | 256² | yes | WORLD chip | wired |
| MW-018 | `assets/word-maize/ui/icon-gamepad.png` | 192² | yes | Free Play | wired |
| MW-019 | `assets/word-maize/ui/icon-fair-tent.png` | 192² | yes | Fair tab + Fair header | wired |
| MW-020 | `assets/word-maize/ui/logo-tagline-plaque.png` | wide | yes | Logo tagline, native text | wired |

## Chapter thumbs (MW-021)

1. Sunny Acres — bright barn, gold fields
2. Green Fields — lush rows, forks in the path
3. Word Hunt — orchard, clue-hunt mood
4. Tall Corn — towering stalks, larger sectors
5. Crow Country — crows over the field
6. Evening Harvest — warm dusk lamp light
7. Misty Valley — fog between corn walls
8. Storm Season — rain and dark clouds over corn

## Prompts

Reuse `docs/art-pipeline/HOME_SCREEN_CHATGPT.md` for home-screen items. Maze plants must match `closed-v3.png` / `empty-v3.png` (single ear, short stump, same lighting). Open cob: kernels packed across the face, no plaque, tile, or blank letter slot.

Detailed spec and history: `docs/CURSOR_MISSING_ART.md`.
