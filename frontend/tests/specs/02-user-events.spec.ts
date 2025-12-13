import { test, expect } from "../fixtures/auth.fixture";

test.describe("User Event Discovery", () => {
  test("should display upcoming events list", async ({ page }) => {
    await page.goto("/events");
    await expect(page.locator('[data-testid="events-list"]')).toBeVisible();
  });

  test("should filter events by search query", async ({ page }) => {
    await page.goto("/events");
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill("test event");
    await expect(
      page.locator('[data-testid="event-card"]').first()
    ).toBeVisible({ timeout: 2000 });
  });

  test("should navigate to event detail page", async ({ page }) => {
    await page.goto("/events");
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    await firstEvent.click();
    await expect(page).toHaveURL(/\/events\/[a-z0-9-]+/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should display event details correctly", async ({ page }) => {
    await page.goto("/events");
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    await firstEvent.click();

    await expect(page.locator('[data-testid="event-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-location"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-capacity"]')).toBeVisible();
  });

  test("should allow RSVP for authenticated user", async ({
    page,
    authenticatedUser,
  }) => {
    await page.goto("/events");
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    await firstEvent.click();

    const rsvpButton = page.locator('button:has-text("RSVP")');
    await rsvpButton.click();

    await expect(page.locator('[data-testid="rsvp-form"]')).toBeVisible();
  });

  test("should show attendee count in real-time", async ({ page }) => {
    await page.goto("/events");
    const firstEvent = page.locator('[data-testid="event-card"]').first();
    await firstEvent.click();

    const attendeeCount = page.locator('[data-testid="attendee-count"]');
    await expect(attendeeCount).toContainText(/\d+/);
  });

  test("should display series events grouped together", async ({ page }) => {
    await page.goto("/events");
    const seriesGroup = page.locator('[data-testid="series-group"]').first();
    await expect(seriesGroup).toBeVisible();
    await expect(seriesGroup.locator('[data-testid="event-card"]')).toHaveCount(
      1
    );
  });

  test("should show only upcoming events by default", async ({ page }) => {
    await page.goto("/events");
    const eventDates = page.locator('[data-testid="event-date"]');
    const count = await eventDates.count();

    for (let i = 0; i < count; i++) {
      const dateText = await eventDates.nth(i).textContent();
      const eventDate = new Date(dateText || "");
      expect(eventDate.getTime()).toBeGreaterThan(Date.now());
    }
  });
});
