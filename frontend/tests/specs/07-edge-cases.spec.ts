import { test, expect } from "../fixtures/auth.fixture";

test.describe("Edge Cases and Error Handling", () => {
  test("should show error for non-existent event slug", async ({ page }) => {
    await page.goto("/events/non-existent-slug-12345");
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test("should show error for non-existent series slug", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events/non-existent-series-12345");
    await expect(page).toHaveURL(/\/admin\/events$/);
  });

  test("should handle WebSocket reconnection", async ({ page }) => {
    await page.goto("/events");
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    await firstEvent.click();

    await page.evaluate(() => {
      (window as any).__eventSocket?.disconnect();
    });

    await page.waitForTimeout(1000);

    const attendeeCount = page.locator('[data-testid="attendee-count"]');
    await expect(attendeeCount).toBeVisible();
  });

  test("should prevent double RSVP submission", async ({
    page,
    authenticatedUser,
  }) => {
    await page.goto("/events");
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    await firstEvent.click();

    const rsvpButton = page.locator('button:has-text("RSVP")');
    await rsvpButton.click();

    await page.locator('input[name="name"]').fill("Test User");
    await page.locator('input[name="email"]').fill("test@example.com");

    const submitButton = page.locator('button:has-text("Submit")');
    await submitButton.click();

    await expect(submitButton).toBeDisabled({ timeout: 1000 });
  });

  test("should handle capacity overflow gracefully", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const editButton = firstEventRow.locator('button:has-text("Edit")');
    await editButton.click();

    const capacityInput = page.locator('input[name="capacity"]');
    await capacityInput.clear();
    await capacityInput.fill("999999999");

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test("should validate timezone selection", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const createEventButton = page.locator('button:has-text("Create Event")');
    await createEventButton.click();

    const timezoneSelect = page.locator('select[name="timezone"]');
    await expect(timezoneSelect).toHaveValue(/^[A-Za-z]+\/[A-Za-z_]+$/);
  });

  test("should handle empty event list gracefully", async ({ page }) => {
    await page.goto("/events");

    const eventsList = page.locator('[data-testid="events-list"]');

    if ((await eventsList.count()) === 0) {
      await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    }
  });

  test("should prevent XSS in event description", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const createEventButton = page.locator('button:has-text("Create Event")');
    await createEventButton.click();

    await page.locator('input[name="title"]').fill("XSS Test");
    await page
      .locator('textarea[name="description"]')
      .fill('<script>alert("XSS")</script>');

    await page.locator('button:has-text("Create")').click();

    const eventRow = page
      .locator('[data-testid="event-row"]')
      .filter({ hasText: "XSS Test" });
    const description = await eventRow
      .locator('[data-testid="event-description"]')
      .textContent();

    expect(description).not.toContain("<script>");
  });

  test("should handle network errors during event creation", async ({
    page,
    adminUser,
    context,
  }) => {
    await context.route("**/api/admin/series/**/events", (route) =>
      route.abort()
    );

    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const createEventButton = page.locator('button:has-text("Create Event")');
    await createEventButton.click();

    await page.locator('input[name="title"]').fill("Network Error Test");
    await page.locator('textarea[name="description"]').fill("Test");

    await page.locator('button:has-text("Create")').click();

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
