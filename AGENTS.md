# Word Maize app guide

- Keep deterministic game rules in `src/game`; React Native screens consume that API.
- The board is cylindrical: column zero neighbors the final column.
- A position may have multiple layers. Only the first unharvested layer is exposed.
- Players tap any visible kernel to build a word in spelling order, then press the word display to submit. Letters need not be neighbors. Horizontal drag rotates the cob to hunt the next letter. Active tools outrank both.
- Keep letters and UI native. Generated PNGs are reusable art, never data.
- Progress, coins, energy, inventory, settings, and daily streak persist locally. There is no account system or game backend.
- Monetization uses RevenueCat (IAP) and AdMob (rewarded ads only). Keys live in `app.json` extras / EAS secrets.
- Real IAP and ads require an Expo development build (`expo-dev-client`). Expo Go cannot load those native modules.
- Run `npm test` and `npm run typecheck` before considering gameplay changes complete.
