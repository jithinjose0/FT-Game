# FART CREW for iPhone

The `iPhone build` GitHub workflow compiles native iOS device and simulator apps on macOS. It embeds the online game at `wss://fc-game.onrender.com`, the current artwork and mobile views, and the microphone permission description for opt-in crew voice.

## What the files mean

- `Fart-Crew-1.9-UNSIGNED.ipa` is compiled for physical iPhones but **is not installable until signed and provisioned**. It is not an App Store or TestFlight release.
- `Fart-Crew-iPhone-Simulator.zip` runs in Xcode's simulator on a Mac, not on physical iPhones.

Apple signing has not been configured. No certificate, private key, device profile or App Store Connect account is included. Do not put signing secrets in Git or send them through chat.

## Install on your own iPhone using a Mac

1. Install Xcode, Node.js 22, CocoaPods and Python with Pillow on a Mac. Clone the repository and run `npm ci` at the root.
2. Build the client with `npm run build -w client`. Run `npm run ios -w client` once to create the native project.
3. Run `python3 tools/prepare-ios.py`, then run `npx cap sync ios` from `packages/client`.
4. Open `packages/client/ios/App/App.xcworkspace` in Xcode. Under the App target's Signing & Capabilities, choose your Apple development team and a bundle identifier registered to that team.
5. Connect the iPhone, enable Developer Mode when required, select the phone in Xcode and choose Run. A personal Apple account can support limited development testing; wider distribution needs appropriate Apple Developer Program signing/provisioning.
6. For TestFlight, create the App Store Connect entry, archive a signed release in Xcode and upload it using Distribute App. For Ad Hoc installation, register the test devices and export with a matching distribution profile.

## Device checks still needed

Test rendering, microphone permission, two-device crew voice and foreground/background behaviour on real iPhones. Physical rotation is supported by the iOS orientation list; the custom manual rotation plugin currently exists only on Android.

For immediate iPhone play without installing an app, open https://fc-game.onrender.com/ in Safari. Add it to the Home Screen if desired. This is the web version, not a signed native build.
