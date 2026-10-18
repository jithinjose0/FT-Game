# Winding co-op track generator

Run from the project root:

```powershell
npx tsx tools/generate-track.ts
npm test
```

Output: `levels/canyon-coop.json`. Implementation: `packages/shared/src/track-generator.ts`.
This is a standalone design/generation module. The current playable game's older Z-based course system does **not** load this map yet.

## Coordinate and schema contract

Y is up. Positions, widths and arc distances use metres; motion periods use seconds; exported banking/rotation use degrees. Each `spline_nodes` item supplies `id`, `edge`, `position: [x,y,z]`, `tangent: [dx,dy,dz]`, full `track_width`, and signed `wall_banking_degrees`. Tangents are derivatives, not control point positions. Positive banking raises the left outer bank, negative raises the right.

`track_segments` are directed graph edges with a zone, node IDs, measured arc length, next-edge IDs and junction IDs. Branch A and B share a split and merge, but have different interior geometry. Each hazard's `position_along_spline` is **metres from its edge's start**, not normalized time. `local_offset` means [right, up, forward] relative to the spline frame. `rotation` is local Euler degrees, `scale` is dimensionless. `motion` describes server-authoritative oscillation; use the same clock for rendering and colliders.

## Geometry algorithm

For endpoints P and Q with derivatives D and E, build quintic Bezier controls:

```
[P, P+D/5, P+2D/5, Q-2E/5, Q-E/5, Q]
```

Evaluate with de Casteljau. Shared derivatives and zero endpoint second derivatives give C2 joins, including branch entrances and exits. Width and bank use smootherstep interpolation. Curvature magnitude is continuous; its derivative need not be. Build an arc-length lookup table so travel, hazard placement and sampling use distance rather than curve parameter. The included sampler oversamples curve spans, and `atDistance` inverts that table.

Raft diameter is 4m: wide pools are 16m, safe branch 14m, standard channels 9m, narrow interiors 6m. Junction mouths widen to 16m so routes merge without cracks. Width transitions belong to the junction approach; the 6m chokepoint core starts at its first interior node. For strict production zoning, split those approaches into separate transition segments.

At each authored turn, compare incoming/outgoing chord directions. For bends over 30°, raise the **outer** bank by clamp(15 + 0.4*(bend-30), 15, 35) degrees. Interpolate the signed angle along the spline. The flat water floor keeps its width; add a 1.5m bank strip and a 1.2m retaining wall outside it. Do not roll the whole water surface. For production, refine bank activation using integrated heading change over a raft-length window of sampled curvature, rather than control-polygon angle alone.

Mesh construction per sampled cross-section:

```
T = normalized spline derivative
R = normalize(cross(worldUp, T))
U = normalize(cross(T, R))
floorLeft  = P - R * width/2
floorRight = P + R * width/2
outerLip = outerFloor + outerR * bankStripWidth
           + U * tan(abs(bankAngle)) * bankStripWidth
connect adjacent ribs with consistently wound triangles
```

The supplied track has no vertical tangent, so world-up frames are safe. For arbitrary loops use parallel transport frames. At graph junctions, triangulate one union/intersection patch for the pool, then weld branch boundaries to it; overlapping independent ribbons would create hidden collision seams. Generate floor and bank colliders from the same vertices as the mesh. Skip the `AIR_GAP` edge's floor and walls entirely; its spline is a routing reference only.

## Sequence and safety rules

1. Spawn: 56m flat safe pool = four seconds at the 14m/s design cap. Enable controls before leaving; no hazards.
2. S curves: alternating left/right banks and an apex rock. Rock flow distortion is a bounded eddy, never a reversed downstream current.
3. Split: central landmass; A is a 6m spiked chute, B a 14m detour with a drifting mine. Binary search solves B's actual spline length to A/0.75.
4. Gauntlet: blades at 30m, pendulum at 78m, tentacle at 126m. The 48m intervals exceed three seconds at the speed cap.
5. Drop, ramp, gap, 16m receiving basin: integrate gravity in open air; do not constrain the raft to the routing spline. Launch at 14m/s horizontal and 5m/s vertical, landing surface 6m below the lip. Flight time is `(vy + sqrt(vy² + 2*g*drop))/g`; horizontal range is approximately 24m against a 14m gap. Test with the full 4m raft footprint and lateral catch-basin bounds. Slower approaches can fail.
6. Final banked bend and arch: place an oriented trigger at the final node. Confirm the raft's trailing extent crosses the plane inside the gate aperture before completing the shared journey.

All discrete high-impact hazards must be at least `speed_cap * 3` metres apart **along every possible route**, including edges before splits and after merges. Do not test Euclidean distance. The validator traverses each route and checks cumulative arc distances. Any game speed boosts must remain inside the configured cap or the timing guarantee no longer holds.

Perimeter spikes are continuous low-rate damage zones, grouped per run, not independent high-impact traps every mesh tile. Integrate damage once per raft per fixed tick, irrespective of overlapping sensor count. Apply bounce only on entry with a cooldown. Grant three seconds of shared high-impact stun/bounce immunity after a discrete trap hit to avoid trap-plus-border chain reactions; this runtime rule must be implemented by the consumer. Damage/flow/collider metadata in the map is a contract, not an engine implementation.

Use a fixed 60Hz authoritative simulation. Closest-point projection selects the active graph edge; at a split keep both candidates until the raft enters a branch, then retain that edge until merge. Never snap the boat to a centerline. Apply current along the local tangent and sum each player's thrust at their raft-relative seat position. On ramps and landings use real rigid-body velocity and angular momentum. Mobile rendering should share static materials and merge static bank geometry into bounded chunks; move only hazard bodies. Physical-device profiling and gameplay clearance tests are still required.
