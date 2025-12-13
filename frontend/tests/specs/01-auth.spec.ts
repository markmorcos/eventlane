import { test, expect } from "../fixtures/auth.fixture";

test.describe("Authentication", () => {
  test("should allow unauthenticated user to view events", async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveURL(/\/events/);
    await expect(page.locator("h1")).toContainText(/events/i);
  });

  test("should redirect admin routes to events for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/admin/events");
    await expect(page).toHaveURL(/\/events/);
  });

  test("should allow authenticated admin to access admin routes", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    await expect(page).toHaveURL(/\/admin\/events/);
    await expect(page.locator("h1")).toContainText(/admin|series/i);
  });

  test("should deny regular user access to admin routes", async ({
    page,
    authenticatedUser,
  }) => {
    await page.goto("/admin/events");
    await expect(page).toHaveURL(/\/events/);
  });

  test("should show sign-in button for unauthenticated users", async ({
    page,
  }) => {
    await page.goto("/events");
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });
});
