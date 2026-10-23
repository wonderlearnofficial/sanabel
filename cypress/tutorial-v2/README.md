# Tutorial V2 — Student layout fixture (local QA only)

Focused browser QA for the Student tutorial cards: every authored step of every
registered guide, at four viewports, in Arabic and English. Kept as permanent
regression infrastructure — it is the only check that catches a card drifting
offscreen, an untranslated key, or a sub-44px control.

## What it does and does not do

- Renders the **production** overlay (`GuideOverlayV2`) with the **production**
  content (`STUDENT_GUIDES`) and the real i18n catalogue.
- Runs every guide in **preview** mode, so nothing persists and no telemetry is
  emitted; the spec asserts both.
- The only fixtures are navigation targets and the profile: `userFixture.ts`
  supplies a static Solo learner. There is no API base URL, no token, and no
  secret of any kind — this page cannot complete a mission, request approval,
  purchase, or grow a tree.
- The provider's own registry is rewritten in `main.tsx` so every guide points
  at this page. Route, view and prerequisite behaviour is covered by the unit
  suites, not here.

## Running it

Two processes, because the harness has its own Vite config on a fixed port:

```bash
npx vite --config cypress/tutorial-v2/vite.config.ts
```

```bash
npx cypress run --config-file cypress/tutorial-v2/cypress.config.ts
```

8 specs: {360x640, 390x667, 390x844, 768x1024} × {ar, en}. Each asserts the card
stays inside the viewport, `dir` matches the locale, no raw `tutorial.student.*`
key reaches the screen, no Arabic leaks into the English run, every button is at
least 44px tall, and nothing was persisted or reported.

`screenshots/` holds the domains card at each viewport for eyeball review; they
are regenerated on every run. Note that Cypress clips the captured PNG to its
runner window, so the 844px and 1024px images are shorter than the emulated
viewport — the assertions still run at the requested size.

The alias in `vite.config.ts` replaces `context/StudentUserProvider`. That alias
exists only in this config; never point it at the app build.
