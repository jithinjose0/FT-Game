# Crew voice and internet play

For deployment now, follow [Render + TURN setup](RENDER.md). The repository includes a free Render Blueprint and a coturn configuration template. `/health` reports whether STUN/TURN settings are present; actual relay/audio validation requires deployed services and phones.

The 1.1 test APK adds an opt-in **ENABLE CREW VOICE** button after joining a boat. Android asks for microphone permission when you enable it. **MUTE / LEAVE VOICE** stops the microphone and closes voice connections. Leaving the room or putting the app in the background also stops voice. Enable it again when you return. Use headphones to reduce speaker echo. Local shared-screen players share one microphone per device.

Voice uses WebRTC audio with echo cancellation and noise suppression. The existing game room relays signaling only between members who opted into that room's voice session. The game server does not record or relay audio. Browser voice requires HTTPS (localhost also works); the Android app uses its secure local WebView origin.

## Friends on different networks

All friends must configure the same **public WSS game server** in Settings. The host creates a boat and shares its six-character room code or copied browser invitation. Friends select JOIN A BOAT and enter that code. There is no account/friends list in this version. A private PC address such as 192.168.1.6 cannot be reached from another home or mobile network. Follow the public deployment steps in SETUP.md; no public deployment has been created by this change.

For reliable voice across mobile networks and restrictive routers, run a TURN relay such as coturn with `use-auth-secret` and configure its `static-auth-secret` on the game server:

```dotenv
VOICE_STUN_URLS=stun:relay.example.com:3478
VOICE_TURN_URLS=turn:relay.example.com:3478,turns:relay.example.com:5349
VOICE_TURN_SECRET=the-same-secret-as-coturn
```

Use your relay's real hostname and secret. Configure TLS certificates and its relay port range on the relay host. Never put the shared secret into VITE variables or the APK. The game server issues expiring, session-specific coturn REST credentials only after a room member enables voice. Credentials last 24 hours; leave and re-enable voice to refresh them for longer sessions. Without configured ICE servers, voice is limited to networks where direct host candidates can connect. STUN alone does not guarantee connectivity; TURN relays audio when a direct route fails. See https://webrtc.org/getting-started/turn-server.

## Validation limits

Automated tests cover opt-in signaling, room routing, rejection of non-participating senders and stopping signaling after leaving voice. TypeScript and APK compilation verify integration. Real microphone audio, Android permission prompts and cross-network TURN audio still need two-device testing with a deployed relay. No TURN account or paid infrastructure is provisioned automatically.
