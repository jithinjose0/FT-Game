# Fart Together — Android test APK

File: `Fart-Together-debug.apk`.

## Install and play

1. Transfer the APK to your Android phone and open it. If Android asks, allow your file manager to install this APK. While this PC server is running, the shared copy can also be downloaded on the same Wi-Fi from `http://192.168.1.5:2567/downloads/Fart-Together-debug.apk`.
2. Keep the phone and PC on the same Wi-Fi. Keep the multiplayer backend running on the PC (`npm run dev` from `D:\New folder\ft`, or `npm start` after a production build).
3. Open **Fart Together → Settings → Multiplayer server**. Enter **`ws://192.168.1.5:2567`**, press **TEST CONNECTION**, then **SAVE SERVER**. This address was reachable during the build; if your PC's Wi-Fi IPv4 address changes, use the new address.
4. Choose a character, assemble a crew, and start the journey. Other phones use the same server address and join using the room code. Local shared-screen players also require the backend.

`localhost` on a phone means the phone, not this PC. If the connection check fails, check Wi-Fi isolation and allow the existing Node server through Windows Firewall on your private network. No firewall changes are made by this build.

## Build details

- Application ID: `com.farttogether.mobile`
- Version: `1.0` (version code 1)
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

The build script uses project-local Gradle caches and a socket directory to avoid Windows temporary-directory socket errors. It copies the APK to this folder and verifies its signature. Use `Fart-Together-debug.apk.sha256` to compare the file hash.
