# Deploy FART CREW: Render game server + crew voice

## 1. Deploy the game

Push the current source, including `render.yaml`, to your GitHub repository. In Render choose **New > Blueprint**, connect that repository, and review the free Singapore web service. The existing Dockerfile builds and serves both the browser game and Node/Colyseus backend. One instance is required: rooms currently live in process memory.

The Blueprint asks for three voice settings. If your relay is not ready, leave these empty for the first deployment (or create a Docker Web Service manually using the same settings). Gameplay works without voice relay configuration. Do not enter example hostnames or secrets.

Once deployed, visit `https://YOUR-SERVICE.onrender.com/health`. It should show `ok: true`. Its `voice.turnConfigured` field reports configuration presence, not a successful relay connection.

Open `https://YOUR-SERVICE.onrender.com/` to play in a browser. In the existing Android app go to **Settings > Multiplayer server**, enter `wss://YOUR-SERVICE.onrender.com`, test and save. Use this same server on every phone. No APK rebuild is needed to set this address. For a store release, set `VITE_SERVER_URL` in the Android build environment to this public WSS address before building/syncing the app.

The existing GitHub Actions workflow runs type checks, tests and builds. The Blueprint uses **After CI Checks Pass** for subsequent deployments. Initial deployment still runs when the service is created. Do not add a second deploy hook workflow, which could trigger duplicate deploys.

Free Render instances sleep after 15 idle minutes and may take about a minute to wake. Open `/health` and wait before inviting friends. Sleep, deployment and restarts discard active rooms. Free local score storage is temporary; configure the existing Supabase integration for durable records, or choose paid persistent storage later. Free CPU capacity must be measured with real games before launch.

## 2. Configure reliable crew voice

For the simpler managed-provider route, follow [account-based Metered TURN](MANAGED-VOICE.md). It uses `VOICE_METERED_HOST` and `VOICE_METERED_API_KEY` on the backend and does not require a new APK.

Render's web service hosts HTTP/WebSocket traffic; it cannot serve as this game's public UDP TURN relay. Use a managed TURN service compatible with coturn REST shared-secret credentials, or a separate Linux VM running coturn. Never put the shared secret in the APK, GitHub repository or a `VITE_*` variable.

For a self-hosted relay:

1. Give the VM a public IPv4 address and point `turn.YOUR-DOMAIN` to it using a DNS-only record (no HTTP proxy).
2. Install coturn (`sudo apt update` then `sudo apt install coturn`) and obtain a trusted TLS certificate for that hostname. Use DNS certificate validation or allow port 80 for HTTP certificate validation. Arrange certificate renewal and reload coturn afterwards. The coturn service account must be able to read its certificate and key.
3. Copy `deploy/turnserver.conf.example` to `/etc/turnserver.conf`. Replace every placeholder: hostname, shared secret, certificate paths, and public/private IP mapping. If the public IP is directly on the VM interface, use `external-ip=PUBLIC_IP` instead of the NAT pair.
4. Allow **3478 UDP/TCP**, **5349 TCP**, and **49160–49260 UDP** in both the provider firewall and OS firewall. Keep relay ports matched to the configuration.
5. Enable and restart coturn: `sudo systemctl enable --now coturn` and `sudo systemctl restart coturn`. Check `sudo systemctl status coturn` and its logs.
6. Add these backend environment variables in Render and redeploy:

```dotenv
VOICE_STUN_URLS=stun:turn.YOUR-DOMAIN:3478
VOICE_TURN_URLS=turn:turn.YOUR-DOMAIN:3478?transport=udp,turn:turn.YOUR-DOMAIN:3478?transport=tcp,turns:turn.YOUR-DOMAIN:5349?transport=tcp
VOICE_TURN_SECRET=THE_SAME_SECRET_AS_STATIC_AUTH_SECRET
```

The backend issues expiring per-session credentials only to opted-in crew members. It relays signaling; the TURN server relays audio when a direct connection fails. This setup does not record voice. TURN bandwidth/VM charges are separate from Render.

## 3. Verify before sharing

- Use one phone on Wi-Fi and another on mobile data. Join the same room and test movement, thrust and spike failure.
- Enable crew voice on both phones, approve microphone permission, use headphones and verify audio in both directions. Verify mute, leave and backgrounding stop microphone access.
- Test relay operation using real credentials and a WebRTC ICE test with relay-only policy; a `relay` candidate proves allocation, while two-way audio and relay traffic confirm actual use. Credentials must be generated privately on the relay/backend; do not paste the shared secret into a public testing page.
- Test portrait/landscape, reconnect behaviour and several simultaneous rooms. A green health response alone does not prove voice or player capacity.

No hosting account, public URL, certificate or relay is provisioned by these source changes. Cross-network microphone testing requires your deployed services and actual phones.

References: https://render.com/docs/blueprint-spec ; https://render.com/docs/free ; https://render.com/docs/websocket ; https://github.com/coturn/coturn/blob/master/examples/etc/turnserver.conf
