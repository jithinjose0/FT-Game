# FART CREW 1.8

Install `Fart-Crew-v1.8-debug.apk` over your existing app. Saved server settings are preserved.

- Before assembling a crew, open **SOUND & BOAT COLOUR**. Choose Perfect fart, Dry fart, or Classic and tap **TEST SOUND**. Your selection is saved and used while thrusting.
- Choose one of six boat colours. The room host chooses the shared boat colour for everyone. Create a new room to apply a new colour.
- The mobile camera now includes both banks, greenery, cliffs and more river ahead in portrait and landscape. River geometry extends behind the starting point to prevent the pale bottom strip.
- Android hides the system bars while playing and uses a river-coloured window background. Swipe from an edge to reveal system controls temporarily. Physical-device confirmation is still needed.

Restart the PC game server to load shared boat colours: stop the previous server with Ctrl+C, then run `node --import tsx packages/server/src/index.ts` from the project folder. Use the PC's Wi-Fi address and port 2567 in the phone's server setting.

Validation: both supplied MP3 previews played to completion in the browser; portrait and landscape framing reviewed; client/server TypeScript checks, production build and all 13 camera/multiplayer checks passed. Four-player checks confirmed host boat-colour synchronization. APK build and signature verification passed.
