# Word Maize app guide

- Keep deterministic game rules in `src/game`; React Native screens consume that API.
- The board is cylindrical: column zero neighbors the final column.
- A position may have multiple layers. Only the first unharvested layer is exposed.
- Word tracing owns gestures that begin on an exposed kernel; empty cob space rotates it. Active tools outrank both.
- Keep letters and UI native. Generated PNGs are reusable art, never data.
- Progress, coins, energy, inventory, settings, and daily streak persist locally. There is no account system or game backend.
- Monetization uses RevenueCat (IAP) and AdMob (rewarded ads only). Keys live in `app.json` extras / EAS secrets.
- Real IAP and ads require an Expo development build (`expo-dev-client`). Expo Go cannot load those native modules.
- Run `npm test` and `npm run typecheck` before considering gameplay changes complete.
