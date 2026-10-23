import { defineConfig } from 'cypress';
export default defineConfig({ video: false, screenshotsFolder: 'cypress/parent-tutorial-v2/screenshots', e2e: {
  baseUrl: 'http://127.0.0.1:5189', supportFile: false,
  specPattern: 'cypress/parent-tutorial-v2/parent-content.cy.ts',
} });
