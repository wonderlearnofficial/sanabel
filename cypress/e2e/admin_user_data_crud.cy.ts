describe('Admin User Data Page CRUD Operations', () => {
  const timestamp = Date.now();
  const schoolName = `Cypress Test School ${timestamp}`;
  const schoolNameEdited = `Cypress Test School Edited ${timestamp}`;
  const className = `Cypress Test Class ${timestamp}`;
  const classNameEdited = `Cypress Test Class Edited ${timestamp}`;
  const studentEmail = `cypress.student.${timestamp}@sanabel.local`;

  beforeEach(() => {
    // Prevent Cypress from failing due to uncaught exceptions in the app
    Cypress.on('uncaught:exception', (err, runnable) => {
      return false;
    });

    // Programmatic login using the admin credentials
    cy.request({
      method: 'PATCH',
      url: 'http://127.0.0.1:5000/users/login',
      body: {
        email: 'admin@sanabel.local',
        password: 'ChangeMe123!',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      const token = response.body.data.user.token;
      const role = response.body.data.user.role;

      // Seed local storage with required state for admin authentication
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('keepLoggedIn', 'true');
      localStorage.setItem('language', 'en');
      localStorage.setItem('dir', 'ltr');
    });

    // Visit the admin user data page directly
    cy.visit('/admin/userdata');
  });

  it('Perform full CRUD on School (Organization), Class, and Student', () => {
    // ──────────────────────────────────────────────────────────────────
    // 1. School (Organization) CRUD
    // ──────────────────────────────────────────────────────────────────
    
    // Switch to Schools tab
    cy.contains('Schools').click();
    cy.contains('School Name').should('exist');

    // Create School
    cy.contains('Create New School').click();
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.get('input').type(schoolName);
      cy.get('button').contains('Create').click();
    });
    cy.contains('Created successfully').should('exist');
    cy.contains(new RegExp(schoolName, 'i')).should('exist');

    // Update School
    cy.contains('tr', new RegExp(schoolName, 'i')).within(() => {
      cy.get('button[title="Edit User"]').click({ force: true });
    });
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.get('input').clear().type(schoolNameEdited);
      cy.get('button').contains('Save Changes').click();
    });
    cy.contains('Saved successfully').should('exist');
    cy.contains(new RegExp(schoolNameEdited, 'i')).should('exist');

    // ──────────────────────────────────────────────────────────────────
    // 2. Class CRUD
    // ──────────────────────────────────────────────────────────────────

    // Switch to Classes tab
    cy.contains('Classes').click();
    cy.contains('Class Name').should('exist');

    // Create Class
    cy.contains('Create New Class').click();
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.get('input').eq(0).type(className);
      cy.get('input').eq(1).type('Grade 1');
      
      // Select School
      cy.get('select').find('option').then(($options) => {
        const option = [...$options].find(opt => opt.text.toLowerCase().includes(schoolNameEdited.toLowerCase()));
        if (!option) throw new Error(`Could not find school option: ${schoolNameEdited}`);
        cy.get('select').select(option.value || option.text);
      });

      cy.get('button').contains('Create').click();
    });
    cy.contains('Created successfully').should('exist');
    cy.contains(new RegExp(className, 'i')).should('exist');

    // Update Class
    cy.contains('tr', new RegExp(className, 'i')).within(() => {
      cy.get('button[title="Edit User"]').click({ force: true });
    });
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.get('input').eq(0).clear().type(classNameEdited);
      cy.get('button').contains('Save Changes').click();
    });
    cy.contains('Saved successfully').should('exist');
    cy.contains(new RegExp(classNameEdited, 'i')).should('exist');

    // ──────────────────────────────────────────────────────────────────
    // 3. Student (User) CRUD & Reset Password
    // ──────────────────────────────────────────────────────────────────

    // Switch to Students tab
    cy.contains('Students').click();
    cy.contains('Name').should('exist');

    // Create Student
    cy.contains('Create New Account').click();
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.contains('Student').click();
      cy.get('input').eq(0).type('Cypress');
      cy.get('input').eq(1).type('Student');
      cy.get('input').eq(2).type(studentEmail);
      cy.get('select').eq(0).select('Primary');
      
      // Select School
      cy.get('select').eq(1).find('option').then(($options) => {
        const option = [...$options].find(opt => opt.text.toLowerCase().includes(schoolNameEdited.toLowerCase()));
        if (!option) throw new Error(`Could not find school option: ${schoolNameEdited}`);
        cy.get('select').eq(1).select(option.value || option.text);
      });

      // Wait for Class dropdown to load options asynchronously
      cy.get('select').eq(2).find('option').should('have.length.gt', 1);

      // Select Class
      cy.get('select').eq(2).find('option').then(($options) => {
        const option = [...$options].find(opt => opt.text.toLowerCase().includes(classNameEdited.toLowerCase()));
        if (!option) throw new Error(`Could not find class option: ${classNameEdited}`);
        cy.get('select').eq(2).select(option.value || option.text);
      });

      cy.get('button').contains('Create Account').click();
    });

    // Verify temp credentials popup
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.contains('Account Created Successfully').should('exist');
      cy.contains('Done').click();
    });

    // Verify student is listed using search input
    cy.get('input[placeholder="Search by name or email..."]').clear().type(studentEmail);
    cy.wait(500); // Wait for debounce
    cy.contains(/cypress student/i).should('exist');

    // Update Student
    cy.contains('tr', /cypress student/i).within(() => {
      cy.get('button[title="Edit User"]').click({ force: true });
    });
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.get('input').eq(0).clear().type('CypressUpdated');
      cy.get('input').eq(1).clear().type('StudentUpdated');
      
      // Wait for Class options to load inside edit modal
      cy.get('select').eq(2).find('option').should('have.length.gt', 1);
      
      cy.get('button').contains('Save Changes').click();
    });
    cy.contains('Saved successfully').should('exist');

    // Clear search and verify updated name
    cy.get('input[placeholder="Search by name or email..."]').clear();
    cy.wait(500);
    cy.contains(/cypressupdated studentupdated/i).should('exist');

    // Reset Password
    cy.contains('tr', /cypressupdated studentupdated/i).within(() => {
      cy.get('button[title="Reset Password"]').click({ force: true });
    });
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.get('button').contains('Reset Password').click();
    });
    cy.contains('Password reset to:').should('exist');

    // ──────────────────────────────────────────────────────────────────
    // 4. Cleanup (Delete Student, Class, School)
    // ──────────────────────────────────────────────────────────────────

    // Delete Student
    cy.contains('tr', /cypressupdated studentupdated/i).within(() => {
      cy.get('button[title="Delete"]').click({ force: true });
    });
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.get('button').contains('Delete').click();
    });
    cy.contains('Deleted successfully').should('exist');

    // Delete Class
    cy.contains('Classes').click();
    cy.contains('tr', new RegExp(classNameEdited, 'i')).within(() => {
      cy.get('button[title="Delete"]').click({ force: true });
    });
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.get('button').contains('Delete').click();
    });
    cy.contains('Deleted successfully').should('exist');

    // Delete School
    cy.contains('Schools').click();
    cy.contains('tr', new RegExp(schoolNameEdited, 'i')).within(() => {
      cy.get('button[title="Delete"]').click({ force: true });
    });
    cy.get('.fixed.inset-0').filter(':visible').last().within(() => {
      cy.get('button').contains('Delete').click();
    });
    cy.contains('Deleted successfully').should('exist');
  });
});
