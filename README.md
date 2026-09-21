# Hi! I'm [**Donald Silveira**](https://donnes.dev/)

I love build amazing products that make people and businesses prosper.

### 🛠 Building

![Syncode](https://github.com/donnes/syncode)&nbsp; -> Agent & Machine Configuration Manager

### Live beach habitat

Paste your OpenRouter key into the ignored `.env` file, then restart `pnpm dev`.
For a fresh checkout, copy `.env.example` to `.env` first. The key stays on the server.
`OPENROUTER_MODEL` defaults to `z-ai/glm-5.3-flash`; change it to a model that supports
JSON schema responses. No key is needed for the local behavior sequence.

The desktop beach alternates rally styles, finishes points before resting, and
invites gulls and crabs. Completed points build fatigue, which leads to a break.
Weather restricts the available actions. Existing lightweight mobile and reduced-motion
poses remain in place and make no model requests. Hidden tabs pause the habitat clock.
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
