# Parent Tutorial V2 layout fixture

Uses production Parent guide content, translations and overlay with an isolated Parent profile. No API/token or gameplay mutation. Every authored step is previewed at four viewport sizes in Arabic and English. Tests cover bounds, direction, translated copy, 44px controls, and absence of persistence/telemetry.

From `client/`, start `npx.cmd vite --config cypress/parent-tutorial-v2/vite.config.ts`, then run:

```powershell
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
npx.cmd cypress run --config-file cypress/parent-tutorial-v2/cypress.config.ts --browser electron --headless --config trashAssetsBeforeRuns=false
```

The environment removal applies only to the current shell; Electron cannot run Cypress in inherited Node-only mode. Screenshots are layout fixtures, not live-child accounts. The browser viewport assertions include tall sizes even where Electron's screenshot capture is limited to its outer window height.
