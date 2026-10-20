# FART CREW — Android test APK

File: `Fart-Crew-debug.apk`.

## Install and play

1. Transfer the APK to your Android phone and open it. If Android asks, allow your file manager to install this APK. Install over the previous debug APK to preserve settings.
2. Keep the phone and PC on the same Wi-Fi. Restart the multiplayer backend from `E:\ft-new\ft\ft` using `node --import tsx packages/server/src/index.ts` so the new thrust, spike and voice rules take effect. Keep that terminal open.
3. Open **FART CREW → Settings → Multiplayer server**. Enter **`ws://192.168.1.6:2567`**, press **TEST CONNECTION**, then **SAVE SERVER**. This address responded from the PC; phone reachability remains unverified. If the PC Wi-Fi IPv4 address changes, use the new address.
4. Choose a character, assemble a crew, and start the journey. Other phones use the same server address and join using the room code. Local shared-screen players also require the backend.

5. After joining a room, tap **ENABLE CREW VOICE** and allow microphone permission. Every crew member must opt in. The button can stop voice; leaving or backgrounding the app also stops microphone capture. Public internet play and reliable voice relay still require hosting; see `docs/VOICE.md`.

`localhost` on a phone means the phone, not this PC. If the connection check fails, check Wi-Fi isolation and allow the existing Node server through Windows Firewall on your private network. No firewall changes are made by this build.

## Build details

- Application ID: `com.farttogether.mobile`
- Version: `1.6` (version code 7)
- Minimum Android API: 23 (Android 6); use an up-to-date Android System WebView with WebGL support.
- Debug signing is for direct testing; this is not a Play Store release build.
- The test APK allows HTTP/WebSocket LAN connections. Release builds retain Android's secure networking defaults and should use HTTPS/WSS.
- The APK packages the client, not the Node/Havok multiplayer server. It is not a standalone offline game.
- No physical-device gameplay test is claimed by this build. Browser gameplay checks are recorded in the project README.

## Rebuild on this PC

Java 21 and Android SDK 35 were installed inside `.tools/` after license approval. From the project root:

```powershell
npm run build
npm run sync -w client
powershell -NoProfile -File tools/build-apk.ps1
```

The build script uses project-local Gradle caches and a socket directory to avoid Windows temporary-directory socket errors. It copies the APK to this folder and verifies its signature. Use `Fart-Crew-debug.apk.sha256` to compare the file hash.
