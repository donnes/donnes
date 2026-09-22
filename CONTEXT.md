# Domain vocabulary

The site is one screen: the Jurerê beach. These are the names the code uses for its parts. Use them in code, commits, and reviews.

## The beach

- **Scene** — the painted beach as it is right now: the fitted painting, the eased weather channels, the pointer, the court state and the device capabilities. One object, created once by the page, handed to every actor.
- **SceneState** — what the beach is like at this moment: sky, phase of day, cloud cover, wind, temperature. Derived from the clock and Open-Meteo, or from a `?wx=` / `?tod=` preview.
- **Channels** (`env`) — every continuous quantity the Scene eases towards its SceneState goal: cover, fog, rain, wet, wind, time of day. Only the channels task writes them.
- **Fit** — the painting-to-screen projection: scale, offsets, the visible left edge and width, and whether the screen is portrait.
- **Caps** — what this device may do: `lite` (phones, tablets, narrow windows), `calm` (reduced motion), `sheet` (phone-width panels), `portrait`.
- **Clock** — the one requestAnimationFrame loop. It runs named tasks in a declared order and pauses for hidden tabs, held sheets, reduced motion and the intro.
- **Actor** — anything that moves per frame: gull, crab, beach ball, birds, sail and kite, sky (sun, moon, clouds), the rally. An actor is `create<Name>(scene, els)` returning `{ tick }` plus named methods.
- **Court** — whether the beach tennis court is in use: `play`, `rest` or `wet`. Decided by the renderer from the channels.
- **Intro** — the loading sequence: outlines traced on paper, then the paint fades in.
- **Panels** — the notebook (Work) and the cream sheet (About, Stack, Contact).

## Beach tennis

- **Match** — the pure rules of the one-set Donald vs Wife exhibition: points, games, tie-break, ends, server. Lives in `src/lib/habitat/match.ts`.
- **Rally** — the animated point on the court: players, ball flight, faults, retrieval. The actor that drives the Match.
- **Policy** — a probability table of shots (drive, lob, drop) per situation (balanced, stretched, tired). Local by default, replaced by the Coach.
- **Situation** — how a player is placed when they hit: balanced, stretched, tired.

## Habitat (the AI stack)

- **Habitat** — the AI-guided life of the beach: a Plan from the Director and a Policy from the Coach, fetched once per context.
- **Context** — the beach's weather as told to the models: sunny, windy, wet, night.
- **Plan** — a short sequence of actions (rally, lob, drop, break, gull, crab) the beach plays through, thirty seconds each.
- **Director** — the OpenRouter provider that writes Plans.
- **Coach** — the TypeSafe provider that writes Policies.
- **Habitat player** — the client actor that picks the context, fetches the Plan and Policy, and plays the Plan's actions.
- **Habitat board** — the notebook page that reports the match, the providers and their token usage.
