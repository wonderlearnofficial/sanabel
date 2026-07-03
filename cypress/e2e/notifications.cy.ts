describe('Notifications & Personal Experience E2E Tests', () => {
  beforeEach(() => {
    // Prevent Cypress from failing due to uncaught exceptions in the app
    Cypress.on('uncaught:exception', (err, runnable) => {
      return false;
    });

    // Programmatic login as student
    cy.request({
      method: 'PATCH',
      url: 'http://localhost:5000/users/login',
      body: {
        email: 'teststudent@sanabel.local',
        password: 'ChangeMe123!',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      const token = response.body.data.user.token;
      const role = response.body.data.user.role;

      // Seed local storage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('keepLoggedIn', 'true');
      localStorage.setItem('language', 'en');
      localStorage.setItem('dir', 'ltr');
      
      // Clear read notification cache in localStorage to force them to be unread
      localStorage.removeItem('read_trophy_challenge_ids');
    });
  });

  it('Verifies notification badge, navigation, and mark-as-read CRUD actions', () => {
    // 1. Visit Student Home and check for the notification button
    cy.visit('/student/home');
    cy.get('div.relative').find('svg').should('exist');

    // 2. Fetch the notification count to see if we have trophies to interact with
    cy.url().then(() => {
      const token = localStorage.getItem('token');
      
      // Let's query the completed trophies from the backend to verify test expectations
      cy.request({
        method: 'GET',
        url: 'http://localhost:5000/students/student-trophy-primaire-completed',
        headers: { Authorization: `Bearer ${token}` }
      }).then((res1) => {
        cy.request({
          method: 'GET',
          url: 'http://localhost:5000/students/student-trophy-secondaire-completed',
          headers: { Authorization: `Bearer ${token}` }
        }).then((res2) => {
          const totalTrophies = (res1.body.data || []).length + (res2.body.data || []).length;
          
          if (totalTrophies > 0) {
            // Case A: The student has completed trophies (notifications exist)
            // The red dot should be visible on the home page
            cy.get('div.relative').find('div.bg-red-500').should('exist');

            // Click the notification badge to navigate to Notifications page
            cy.get('div.relative').filter(':visible').first().click();
            cy.url().should('include', '/notifications');

            // Verify notifications are listed
            cy.contains(/achievement|achievements|إنجاز/i).should('exist');
            cy.get('div.p-4.space-y-3').find('div.flex.items-center').should('have.length.at.least', 1);

            // Verify the "Mark all as read" button is displayed in the header
            cy.contains(/Mark all as read|تحديد الكل كمقروء/i).should('exist');

            // Click "Mark as read" on the first notification card
            cy.contains(/Mark as read|تحديد كمقروء/i).first().click();

            // Verify that the individual notification changes status (the button disappears)
            cy.contains(/Mark as read|تحديد كمقروء/i).should('have.length.lessThan', totalTrophies);

            // Click "Mark all as read"
            cy.contains(/Mark all as read|تحديد الكل كمقروء/i).click();

            // All unread indicator buttons should now be gone
            cy.contains(/Mark as read|تحديد كمقروء/i).should('not.exist');
            cy.contains(/Mark all as read|تحديد الكل كمقروء/i).should('not.exist');

            // Go back to the student home page and verify the red dot is gone
            cy.visit('/student/home');
            cy.get('div.relative').find('div.bg-red-500').should('not.exist');
          } else {
            // Case B: No completed trophies (no notifications)
            // The red dot should not exist on the home page
            cy.get('div.relative').find('div.bg-red-500').should('not.exist');

            // Navigate to notifications page and check empty state
            cy.visit('/notifications');
            cy.contains(/No notifications|لا يوجد إشعارات/i).should('exist');
          }
        });
      });
    });
  });

  it('Verifies personal experience flow (hiding leaderboards & allowing task completion)', () => {
    // 1. Visit Student Home and verify that the Leaderboards tab is NOT in the navbar
    cy.visit('/student/home');
    cy.contains(/Leaderboards|المتصدرين/i).should('not.exist');

    // 2. Try to navigate to Leaderboards page directly and verify redirect to /student/home
    cy.visit('/student/leaderboards');
    cy.url().should('include', '/student/home');

    // 3. Visit Todo List page and verify that student can access and add tasks
    cy.visit('/student/todolist');
    cy.contains(/قائمة المهام|To-Do List/i).should('exist');
    cy.contains(/إضافة مهمة جديدة|Add new task/i).should('exist');
  });
});
