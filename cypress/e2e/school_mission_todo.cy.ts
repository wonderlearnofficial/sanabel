describe('School Student persistent mission To-Do', () => {
  it('keeps student/teacher/parent assignments in one list and requests approval without self-awarding', () => {
    cy.viewport(390, 844);
    const student = { id: 9, classId: 4, organizationId: 2, xp: 0, snabelRed: 0, snabelBlue: 0, snabelYellow: 0,
      user: { firstName: 'School', lastName: 'Student', email: 'school@example.invalid', seenGuides: [] } };
    const task = (id: number, title: string) => ({ id, title, type: 'Community', xp: 5, snabelRed: 1, snabelBlue: 1, snabelYellow: 1 });
    const items: any[] = [
      { id: 101, status: 'todo', createdAt: new Date().toISOString(), Task: task(1, 'Student mission'),
        Sources: [{ sourceType: 'student', sourceId: 9, name: 'You' }], ApprovalRequests: [] },
      { id: 102, status: 'todo', createdAt: new Date().toISOString(), Task: task(2, 'Teacher mission'),
        Sources: [{ sourceType: 'teacher', sourceId: 5, name: 'Ms Amal' }], ApprovalRequests: [] },
      { id: 103, status: 'todo', createdAt: new Date().toISOString(), Task: task(3, 'Parent mission'),
        Sources: [{ sourceType: 'parent', sourceId: 7, name: 'Mom' }], ApprovalRequests: [] },
      { id: 104, status: 'completed', createdAt: new Date().toISOString(), Task: task(4, 'Direct completion history'),
        Sources: [], completionSource: 'parent_direct', completedByName: 'Mom', ApprovalRequests: [] },
    ];
    let selfAwardCalls = 0;
    cy.intercept('GET', '**/students/data', { data: { student, completedTasks: { taskIds: [] } } }).as('profile');
    // Shared trophy providers mount with the Student shell. Keep every
    // authenticated background request inside this isolated fixture so a fake
    // token cannot trigger the global invalid-session redirect.
    cy.intercept('GET', '**/students/student-trophy-*-completed', { data: [] });
    cy.intercept('GET', '**/users/session', { statusCode: 200, body: {} });
    cy.intercept('GET', '**/mission/myApprovers', { data: { approvers: [{ id: 5, type: 'teacher', name: 'Ms Amal' }] } });
    cy.intercept('GET', '**/mission/todo', req => req.reply({ body: { data: items } })).as('todo');
    cy.intercept('POST', '**/mission/requestApproval', req => {
      expect(req.body).to.include({ taskId: 1, todoItemId: 101, approverId: 5, approverType: 'teacher' });
      items[0].status = 'pending_approval';
      items[0].ApprovalRequests = [{ id: 500, status: 'pending' }];
      req.reply({ statusCode: 201, body: { data: items[0].ApprovalRequests[0] } });
    }).as('requestApproval');
    cy.intercept('POST', '**/students/add-pros', req => { selfAwardCalls += 1; req.reply({ statusCode: 403 }); });

    cy.visit('/student/todolist', { onBeforeLoad(win) {
      win.localStorage.setItem('token', 'fixture-token');
      win.localStorage.setItem('role', 'Student');
      win.localStorage.setItem('language', 'en');
      win.localStorage.setItem('sanabel:permissions_onboarding_completed', 'true');
      win.sessionStorage.setItem('guideAutoShownThisSession-school@example.invalid', 'true');
    } });
    cy.wait('@todo');
    cy.contains('Student mission').should('be.visible');
    cy.contains(/Assigned by.*Ms Amal/).should('be.visible');
    cy.contains(/Assigned by.*Mom/).should('be.visible');
    cy.contains(/Direct completion history/).should('be.visible');
    cy.contains(/No prior assignment/).should('be.visible');

    cy.get('[data-testid="complete-mission-1"]').click();
    cy.get('[data-testid="approver-option-teacher:5"]').click();
    cy.get('[data-testid="confirm-mission-action"]').click();
    cy.wait('@requestApproval');
    cy.contains('Waiting for approval').should('be.visible');
    cy.reload();
    cy.contains('Waiting for approval').should('be.visible');
    cy.then(() => expect(selfAwardCalls).to.equal(0));
  });
});
