import { defineConfig } from 'cypress';
export default defineConfig({ video: false, screenshotsFolder: 'cypress/tutorial-v2/screenshots', e2e: {
  baseUrl: 'http://127.0.0.1:5187', supportFile: false,
  specPattern: 'cypress/tutorial-v2/student-content.cy.ts',
} });
