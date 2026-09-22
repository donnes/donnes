# ADR 0001 — The beach scene is a set of actor modules on one explicit clock

Date: 2026-09-22 · Status: accepted

## Context

`beach-home.astro` held the whole beach: 440 lines of build-time geometry, 890 of markup, 890 of CSS and 1,970 of client script. Every actor was an anonymous closure pushed into one `tasks[]` array, wired to the others through forward-declared no-op `let`s, and the tests located modules by `String.indexOf` on comment text.

## Decision

1. **Actors are modules in `src/lib/beach/`.** Each is `create<Name>(scene, els)` returning `{ tick(dt, now) }` plus named methods (`invite`, `snap`). Behaviour and painting live in the same file; where the split is a pure cut, `step` and `paint` are separate functions inside it.
2. **One `Scene` handle, `Readonly` for actors.** The page creates it once. Only the channels task, `measure()`, the pointer listener and the sky (which owns `lum`, where the sun or moon is) hold the mutable type. No module-level mutable singletons.
3. **The clock takes an explicit ordered list.** `clock.add(name, tick)` in source order in the boot code, with a comment on why the order matters. No topological sort, no phases, no event bus. Eleven tasks do not justify machinery.
4. **Cross-actor wiring is events returned to boot.** The Habitat player returns `{ action, invite? }`; boot dispatches to the gull, crab or rally. A missing element means the actor is not registered, visibly, in boot.
5. **Tests import the modules** and run under `node --test --experimental-strip-types`. No runner dependency. Modules must avoid `enum` and parameter properties. `tests/resolve-ts.mjs` maps the habitat lib's `./x.js` sibling imports (the shape Vercel bundles) to `.ts` for the test run only.
6. **Randomness is injected** as `scene.random`, so tests seed without patching globals.

## Consequences

- The `.astro` file keeps markup, CSS, element queries and boot.
- Adding an actor means one file, one `clock.add` line, and one test.
- `beach-head.astro` keeps its inline ES5 copy of the fit formula on purpose: it must paint before the bundle loads.
- `display.ts` keeps its singleton for now; changing it changes how `habitat-board.astro` talks to it, which is a separate decision.
