/// <reference types="cypress" />
describe('Teacher V2 real content layout and preview', () => {
  for (const [width, height] of [[360, 640], [390, 667], [390, 844], [768, 1024]]) {
    for (const locale of ['ar', 'en']) {
      it(`${locale} ${width}x${height}: every authored step stays on screen`, () => {
        cy.viewport(width, height);
        cy.visit(`/cypress/teacher-tutorial-v2/index.html?locale=${locale}`);
        cy.window().its('tutorialFixture').should('exist');
        cy.window().then((win: any) => {
          const entries = win.tutorialFixture.guides;
          for (const entry of entries) {
            cy.window().then((w: any) => { w.tutorialFixture.show(entry.id); });
            for (let index = 0; index < entry.steps; index++) {
              cy.window().its('tutorialFixture.active.guide.id').should('equal', entry.id);
              cy.window().its('tutorialFixture.active.stepIndex').should('equal', index);
              cy.get('[data-guide-preview="true"]').should('be.visible').should(dialog => {
                const rect = dialog[0].getBoundingClientRect();
                expect(rect.left).to.be.at.least(0); expect(rect.top).to.be.at.least(0);
                expect(rect.right).to.be.at.most(width); expect(rect.bottom).to.be.at.most(height);
                expect(dialog.attr('dir')).to.equal(locale === 'ar' ? 'rtl' : 'ltr');
                expect(dialog.text()).not.to.include('tutorial.teacher.');
                if (locale === 'en') expect(dialog.text()).not.to.match(/[؀-ۿ]/);
                for (const button of dialog.find('button').toArray()) expect(button.getBoundingClientRect().height).to.be.at.least(44);
              });
              // The two cards a reviewer needs to read: the Assign/Complete
              // distinction and the recap that follows a real assignment.
              if (entry.id === 'teacher-assign-vs-complete') cy.screenshot(`teacher-distinction-${locale}-${width}x${height}`, { capture: 'viewport' });
              if (entry.id === 'teacher-first-assignment' && index === 2) cy.screenshot(`teacher-mode-${locale}-${width}x${height}`, { capture: 'viewport' });
              if (index < entry.steps - 1) cy.window().then((w: any) => { w.tutorialFixture.next(); });
            }
          }
        });
        cy.window().then((win: any) => {
          expect(win.tutorialFixture.events).to.have.length(0);
          expect(Object.keys(win.localStorage).filter(key => /guideProgress|seenGuides/.test(key))).to.have.length(0);
        });
      });
    }
  }
});
