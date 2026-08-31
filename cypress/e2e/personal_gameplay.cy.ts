// Browser integration with a stateful API fixture. Real HTTP/MySQL concurrency
// and rollback are covered separately by the server integration suite.
describe('Personal gameplay on mobile', () => {
  it('reconciles a delayed completion and purchase across navigation and reload', () => {
    cy.viewport(390, 844);
    const date = new Date().toISOString().slice(0, 10);
    const student = { id: 7, classId: null, organizationId: null, xp: 0, snabelRed: 100, snabelBlue: 100, snabelYellow: 100, water: 0, seeders: 0, treeProgress: 1,
      user: { firstName: 'Personal', lastName: 'Student', email: 'gameplay@example.invalid', seenGuides: [] } };
    const taskIds: number[] = [];
    let completions = 0, purchases = 0;
    cy.intercept('GET', '**/students/data', req => req.reply({ delay: 350, body: { data: { student, treePoint: { water: 2, seeders: 2, stage: 0, treeProgress: 1 }, completedTasks: { date, taskIds } } } })).as('profile');
    cy.intercept('GET', '**/users/session', { statusCode: 200, body: {} });
    cy.intercept('GET', '**/students/*trophy*', { data: [] });
    cy.intercept('GET', '**/students/calculate-completed-tasks-by-category', { totalCompletedTasks: 0, categoryCounts: [] });
    cy.intercept('POST', '**/students/add-pros', req => {
      completions++;
      student.xp = 15; taskIds.push(1);
      req.reply({ statusCode: 201, delay: 700, body: { student, completion: { taskId: 1, date, completionStatus: 'Completed' } } });
    }).as('complete');
    cy.intercept('PATCH', '**/students/buy-water-seeder', req => {
      purchases++;
      expect(req.body).to.deep.equal({ water: 1, seeders: 0 });
      student.water = 1; student.snabelRed = 90; student.snabelBlue = 90; student.snabelYellow = 90;
      req.reply({ delay: 700, body: { student } });
    }).as('purchase');
    cy.visit('/student/todolist', { onBeforeLoad(win) {
      win.localStorage.setItem('token', 'fixture-token');
      win.localStorage.setItem('role', 'Student');
      win.localStorage.setItem('language', 'ar');
      win.localStorage.setItem('sanabel:permissions_onboarding_completed', 'true');
      win.sessionStorage.setItem('guideAutoShownThisSession-gameplay@example.invalid', 'true');
      win.localStorage.setItem('sanabel:todos:7', JSON.stringify([{ id: 1, task: { id: 1, title: 'Personal task', type: 'Kind' }, completed: false }]));
    } });
    cy.wait('@profile');
    cy.get('[data-testid="complete-mission-1"]').click();
    cy.contains('button', /^تأكيد$/).click();
    cy.contains('button', 'جاري التحديث...').should('be.disabled');
    cy.wait('@complete');
    cy.get('[data-testid="complete-mission-1"]').should('have.attr', 'aria-pressed', 'true');
    cy.reload();
    cy.get('[data-testid="complete-mission-1"]').should('have.attr', 'aria-pressed', 'true');
    cy.visit('/student/progress');
    cy.contains('h1', 'الشجرة').parent().click();
    cy.get('[data-testid="shop-add-water"]').click();
    cy.contains(/^شراء$/).click();
    cy.contains('button', 'تأكيد الشراء').click();
    cy.contains('button', 'جاري الشراء...').should('be.disabled');
    cy.wait('@purchase');
    cy.contains('تمت عملية الشراء بنجاح').should('be.visible');
    cy.contains('button', 'إغلاق').click();
    cy.get('[data-testid="inventory-water"]').should('contain.text', '1');
    cy.get('[data-testid="inventory-red"]').should('contain.text', '90');
    cy.reload();
    cy.contains('h1', 'الشجرة').parent().click();
    cy.get('[data-testid="inventory-water"]').should('contain.text', '1');
    cy.get('[data-testid="inventory-red"]').should('contain.text', '90');
    cy.then(() => { expect(completions).to.equal(1); expect(purchases).to.equal(1); });
  });
});
