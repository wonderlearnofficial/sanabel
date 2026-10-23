describe("Mobile Admin Cutover Browser Regression", () => {
  it("navigating to /admin/userdata redirects away from legacy Admin UI", () => {
    cy.visit("/admin/userdata");
    cy.url().should("include", "/admin-redirect");

    // Must NOT render legacy Admin UI elements
    cy.contains("UserData").should("not.exist");
    cy.contains("AdminHeader").should("not.exist");
    cy.contains("AdminNavbar").should("not.exist");
    cy.get("[data-testid='admin-header']").should("not.exist");
    cy.get("[data-testid='admin-sidebar']").should("not.exist");

    // Must render dedicated Admin Console handoff screen
    cy.contains("هذا الحساب يستخدم لوحة الإدارة").should("be.visible");
    cy.contains("فتح لوحة الإدارة").should("be.visible");
    cy.contains("تسجيل الخروج").should("be.visible");
  });

  it("navigating to /admin or /admin/home redirects to /admin-redirect", () => {
    cy.visit("/admin");
    cy.url().should("include", "/admin-redirect");
    cy.contains("هذا الحساب يستخدم لوحة الإدارة").should("be.visible");

    cy.visit("/admin/home");
    cy.url().should("include", "/admin-redirect");
    cy.contains("هذا الحساب يستخدم لوحة الإدارة").should("be.visible");
  });
});
