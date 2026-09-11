# Word Maize app guide

- Keep deterministic game rules in `src/game`; React Native screens consume that API.
- Product and remaining work: `docs/WORD_MAIZE.md`.

## World Maize

- Walk a rectangular field. Corn walls do not wrap.
- Inspect a letter plant in range to peek; harvest a **showing** FIND letter in range even if you are not facing it. Wrong letters cost nothing.
- Letters and HUD stay native. Plant PNGs never include baked letters.
- Sandy Point teaches walk/peek/harvest, then a harder BARN, then a mower-gated SEED plant. First mower and husk-clip use pause for a how-to.

## Cob Harvest

- The board is cylindrical: column zero neighbors the final column.
- A position may have multiple layers. Only the first unharvested layer is exposed.
- Players tap any visible kernel to build a word in spelling order, then press the word display to submit. Letters need not be neighbors. Horizontal drag rotates the cob. Active tools outrank both.
- Level 1 stays readable. From level 2, letters shuffle so you turn the cob. A later sun-clock star asks for a first word soon; missing it does not fail the cob. Rot spoils a kernel on a timer and it falls off for good.

## Shared

- Generated PNGs are reusable art, never data.
- Progress, coins, energy, inventory, settings, and daily streak persist locally. There is no account system or game backend.
- Monetization uses RevenueCat (IAP) and AdMob (rewarded ads only). Keys live in `app.json` extras / EAS secrets.
- Real IAP and ads require an Expo development build (`expo-dev-client`). Expo Go cannot load those native modules.
- Run `npm test` and `npm run typecheck` before considering gameplay changes complete.
