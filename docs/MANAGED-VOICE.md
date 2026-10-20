# Account-based TURN voice on Render

The shared Open Relay endpoints previously suggested timed out in allocation checks from the development machine. That does not prove a universal outage, but they are not a verified reliable relay for this deployment. Use an account-based service and test two real phones.

1. Sign up at https://dashboard.metered.ca/ and create a TURN application. Select the free allowance if offered, review its current terms and usage limits, and enable usage notifications.
2. In the TURN instructions/API credentials, find your application hostname (for example `your-app.metered.live`) and TURN REST API key. This is not the Realtime Messaging publishable key. Do not send the key in chat or commit it to GitHub.
3. In Render > fc-game > Environment, remove the old `VOICE_TURN_URLS` and `VOICE_TURN_SECRET` shared-relay values. Add:

```dotenv
VOICE_METERED_HOST=your-app.metered.live
VOICE_METERED_API_KEY=YOUR_PRIVATE_TURN_REST_API_KEY
```

Use the hostname only, without `https://` or a path. The backend calls the provider credentials API and sends only the returned ICE credentials to opted-in crew members. Managed credentials take precedence over coturn credentials if both are set, but remove unused settings to avoid confusion.

4. Save and deploy the latest source. `/health` should show `voice.turnConfigured: true`; this indicates configured settings, not a successful relay allocation.
5. Leave existing game rooms and create a new one. On both devices disable/re-enable crew voice to fetch fresh ICE settings. No APK rebuild is required for this backend change.
6. Test one phone on Wi-Fi and the other on mobile data. Allow microphone access, use headphones, and verify speech in both directions. If it fails, check the provider's usage/allocation dashboard and Render notices. A provider error produces a game notice without exposing its API key.

For relay allocation diagnostics, run `node tools/check-turn.mjs wss://fc-game.onrender.com`. This creates and leaves a temporary room, obtains real room-issued credentials, and tests TURN allocations without accessing microphones. It prints endpoint URLs and success/error codes, never credentials. A timeout may also mean the testing machine's network blocks that transport. Successful allocation still requires a two-device audio test.

Provider documentation and current allowance: https://www.metered.ca/tools/openrelay/
