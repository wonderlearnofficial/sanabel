import { defineConfig } from 'cypress';
export default defineConfig({ video: false, screenshotsFolder: 'cypress/teacher-tutorial-v2/screenshots', e2e: {
  baseUrl: 'http://127.0.0.1:5191', supportFile: false,
  specPattern: 'cypress/teacher-tutorial-v2/teacher-content.cy.ts',
} });
