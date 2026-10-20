# FART CREW 1.7

Install `Fart-Crew-v1.7-debug.apk` over the existing app. Its package ID and debug signing identity remain the same, so saved server settings are preserved.

- Use the **LANDSCAPE / PORTRAIT** button at the upper right to rotate manually. The Android app remembers this choice. Default orientation is portrait. Switching does not recreate the room.
- The mobile camera is closer, making the raft and characters larger. The existing camera-view button switches to a wider bird view when needed.
- The river has greener water, moving downstream highlights and stronger current-texture animation. The boat uses warm timber, rope trim and a forest-green hull. These are visual changes; there is no automatic river thrust.
- The browser may not support orientation locking. In that case the button explains that the Android app is required, or the phone can be physically rotated.

TypeScript, web build, multiplayer and camera checks passed. APK signature verification passed. Android native rotation still needs testing on a physical phone.

Rebuild with `powershell -NoProfile -File tools/build-apk.ps1 -OutputName Fart-Crew-v1.7-debug.apk` after building and syncing the client.
