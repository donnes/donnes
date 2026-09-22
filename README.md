# Hi! I'm [**Donald Silveira**](https://donnes.dev/)

I love build amazing products that make people and businesses prosper.

### 🛠 Building

![Syncode](https://github.com/donnes/syncode)&nbsp; -> Agent & Machine Configuration Manager

### Live beach habitat

Paste your OpenRouter key into the ignored `.env` file, then restart `pnpm dev`.
For a fresh checkout, copy `.env.example` to `.env` first. The key stays on the server.
`OPENROUTER_MODEL` defaults to `z-ai/glm-5.3-flash`; change it to a model that supports
JSON schema responses. No key is needed for the local behavior sequence.

The beach alternates rally styles and finishes points before resting. Desktop
scenes also invite gulls and crabs. Completed points build fatigue, which leads to a break.
Rallies run in any dry daylight, overcast or fog included; rain, storms and night restrict the available actions. Mobile plays the tennis rallies using the
same cached plans; reduced motion keeps a held pose and makes no model requests.
Hidden tabs pause the habitat clock.
The model picks action names only; the scene owns every movement and ball contact.

A visit requests at most two plans, with no automatic retries. Each successful plan
is cached for an hour by the warm server and Vercel's CDN. Requests share an in-flight
call, use a 60-second cooldown, and have a 1,024-token output limit including reasoning.
Failed calls use local behavior and a five-minute cache. No photos, visitor identifiers,
conversation history, or page contents are sent to OpenRouter.

`HABITAT_MAX_CALLS_PER_DAY` defaults to 8 and is capped at 24. Set it to 0 to disable
paid calls. This limit applies per warm server process and resets on cold starts;
it is **not a global spending cap**. Set a credit limit on the OpenRouter key to
bound total spend across deployments and instances.

Production uses the native Vercel function in `api/habitat.ts`; the portfolio pages
remain static. Configure the same env variables in Vercel before deploying. Local
Astro development serves the same handler through `scripts/habitat-dev.mjs`.
Use Node 22 for deployment. `astro preview` previews static pages only, so use
`pnpm dev` when testing the habitat endpoint locally.

Run `pnpm test:habitat` and `pnpm build`. To inspect behavior, open
`http://localhost:4321/?wx=clear&tod=midday` on desktop and watch a few points.
The document's `data-habitat` and `data-habitat-source` attributes expose the current
intention and plan source for debugging. A break takes effect after ball retrieval.
Test rainy/night scenes, tab switching, and reduced motion too.

The optional TypeSafe tennis coach uses a separate `TYPESAFE_API_KEY`. It batches
three Choice questions for balanced, stretched, and tired players into one request
to `jev-latest`. The returned shot distributions are validated and cached for an
hour. Each hit samples the distribution for the observed situation; the model never
controls coordinates or contact timing. A requested habitat rally style biases
balanced shots, while recovery takes priority when a player is stretched or tired.
No request is made per volley. Weather changes discard the old policy.

`TYPESAFE_MAX_CALLS_PER_DAY` defaults to 4 per warm process, with an upper bound of
12. Missing credentials, invalid replies, timeouts, or exhausted budgets use local
shot weights. `data-tennis-source` on the document and `data-shot`/`data-situation`
on `.jb-court` expose the active behavior. Restart development after changing keys.

A wooden courtside sign opens the AI field notebook. It shows executed shots,
observed player situations, model names, and provider-reported input/output tokens
for the currently active cached plans. It does not estimate missing usage, count
cached deliveries as new spending, or expose model reasoning. The notebook uses a
native dialog with Escape and focus return, and supports English and Portuguese.

### Profiling the Android beach

Use a production build for frame measurements: `pnpm build`, then
`pnpm preview --host :: --port 4323`. Forward the page and Chrome's debugger through
ADB on the connected phone:

```sh
adb -s <device> reverse tcp:4323 tcp:4323
adb -s <device> forward tcp:9222 localabstract:chrome_devtools_remote
```

Open `http://localhost:4323/?wx=clear&tod=midday` in Chrome on the unlocked phone.
The steady-state capture leaves the page in place; the loading capture reloads it.

```sh
node scripts/profile-android.mjs http://localhost:9222 localhost:4323 15000 /tmp/beach-steady.json
node scripts/profile-loading-android.mjs localhost:4323 /tmp/beach-loading.json
pnpm test:frames
```

Keep the browser visible throughout each capture. The loading report separates
preparation, contour drawing, color fade, and the running scene. Raw samples retain
phase boundaries. These measure browser callback cadence; pair them with Android
rendering traces or `dumpsys gfxinfo` to assess presented frames.

The mobile sketch draws the existing SVG geometry onto one canvas, including shared
`use` definitions, clipping paths, and the overcast cloud bands. Its backing scale
is capped at 1.5; the painted art stays at native resolution. Desktop retains the
SVG contour animation. Both wait for the drawing to finish before fading into color.
Palettes are read from isolated elements instead of repeatedly restyling the page.
The scene clock follows display callbacks, and layout uses the painting's stable
viewport height so the browser toolbar cannot shift the court.

September 21, 2026, physical SM-S731B / Android 16, static production preview:
Chrome's original clear-midday drawing averaged 37.6 callbacks/sec with a 317ms gap.
Afterward, an overcast-midday capture averaged 60 during drawing and color fade.
DuckDuckGo's final clear-midday capture averaged 117 during drawing, 107 during the
fade, and 60 once painted, as its refresh cadence changed. That capture still had
a 25ms animation interval and startup tasks up to 128ms before drawing began.
Android reported 21 janky frames out of 1,415 across loading and subsequent play.
These samples demonstrate the improvement, not a guarantee of zero dropped frames
on every device. Static preview uses local tennis rules because it has no AI endpoint.

### Beach tennis matches

Donald and his wife play a one-set 1-vs-1 exhibition. The court keeps its illustrated
layout; this is not a four-player doubles simulation. The deterministic rules in
`src/lib/habitat/match.ts` score 0/15/30/40 with no-ad, six games with a two-game lead,
and a seven-point, win-by-two tie-break at 6–6. One player serves the whole game;
tie-break service follows one point, then alternating pairs. Players change ends
after odd games and after tie-break points 1, 5, 9, etc. A nine-second result display
precedes a rematch with the other opening server.

The first sand contact ends a point. Landing coordinates determine in/out, with
lines included; later dead-ball bounces never score again. A blocked serve loses
the point immediately, while a serve brushing the tape and crossing continues.
Ball retrieval cannot change the designated server. Weather suspends an unfinished
point without changing the score. AI still selects shot style from cached policies;
match scoring introduces no model calls. The clickable courtside board shows points,
games, server, deciding points, tie-breaks, and the final result.

`pnpm test:habitat` includes pure scoring tests and a deterministic replay of two
complete matches through the actual animation state machine, including service
position, rematches, point deduplication, and weather suspension.
