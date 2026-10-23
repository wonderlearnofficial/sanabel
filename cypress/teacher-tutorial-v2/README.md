# Tutorial V2 — Teacher layout fixture (local QA only)

Focused browser QA for the Teacher tutorial cards: every authored step of every
registered Teacher guide, at four viewports, in Arabic and English. Same
architecture as `cypress/tutorial-v2` (Student) and `cypress/parent-tutorial-v2`
(Parent); Phase 3A deferred this fixture to integration, which is where it was
added.

It caught a real defect on its first run: the overlay's step counter fell back
to a raw Arabic literal for any non-Student, non-Parent guide, so an English
Teacher card announced "خطوة 1 / 2".

## What it does and does not do

- Renders the **production** overlay (`GuideOverlayV2`) with the **production**
  content (`TEACHER_GUIDES`) and the real i18n catalogue.
- Runs every guide in **preview** mode, so nothing persists and no telemetry is
  emitted; the spec asserts both.
- The only fixtures are navigation targets and the profile: `userFixture.ts`
  supplies a static Teacher with an organization. No API base URL, no token, no
  secret. This page cannot assign, complete, approve or deny.
- Route, view, predicate and real-success behaviour is covered by the unit
  suites (`src/guides/v2/__tests__/teacherExperience.test.tsx`), not here.

## Running it

```bash
npx vite --config cypress/teacher-tutorial-v2/vite.config.ts
```

```bash
npx cypress run --config-file cypress/teacher-tutorial-v2/cypress.config.ts
```

8 specs: {360x640, 390x667, 390x844, 768x1024} × {ar, en}. Each asserts the card
stays inside the viewport, `dir` matches the locale, no raw `tutorial.teacher.*`
key reaches the screen, no Arabic leaks into the English run, every button is at
least 44px tall, and nothing was persisted or reported.

`screenshots/` keeps the Assign-vs-Complete card and the assignment mode step at
each viewport for review; they are regenerated on every run. Cypress clips the
captured PNG to its runner window, so the 844px and 1024px images are shorter
than the emulated viewport — the assertions still run at the requested size.

The alias in `vite.config.ts` replaces `context/StudentUserProvider`. That alias
exists only in this config; never point it at the app build.
