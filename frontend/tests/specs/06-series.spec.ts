import { test, expect } from "../fixtures/auth.fixture";
import { DataFactory } from "../helpers/data.factory";

test.describe("Event Series Management", () => {
  test("should display series information correctly", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    await expect(page.locator('[data-testid="series-title"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="series-description"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="series-location"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="recurrence-display"]')
    ).toBeVisible();
  });

  test("should update series metadata", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const editButton = page.locator('button:has-text("Edit Series")');
    await editButton.click();

    const newTitle = "Updated Series " + Date.now();

    await page.locator('input[name="title"]').clear();
    await page.locator('input[name="title"]').fill(newTitle);

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('[data-testid="series-title"]')).toContainText(
      newTitle
    );
  });

  test("should group series events by date", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const eventRows = page.locator('[data-testid="event-row"]');
    const count = await eventRows.count();

    if (count > 1) {
      for (let i = 0; i < count - 1; i++) {
        const date1 = await eventRows
          .nth(i)
          .locator('[data-testid="event-date"]')
          .textContent();
        const date2 = await eventRows
          .nth(i + 1)
          .locator('[data-testid="event-date"]')
          .textContent();

        const time1 = new Date(date1 || "").getTime();
        const time2 = new Date(date2 || "").getTime();

        expect(time1).toBeLessThanOrEqual(time2);
      }
    }
  });

  test("should show series recurrence pattern", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();

    await expect(
      firstSeries.locator('[data-testid="recurrence-badge"]')
    ).toBeVisible();
  });

  test("should generate events based on recurrence rule", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");

    const createButton = page.locator('button:has-text("Create Series")');
    await createButton.click();

    const seriesData = DataFactory.createEventSeries();

    await page.locator('input[name="title"]').fill(seriesData.title);
    await page
      .locator('textarea[name="description"]')
      .fill(seriesData.description);
    await page.locator('input[name="location"]').fill(seriesData.location);
    await page
      .locator('input[name="capacity"]')
      .fill(seriesData.capacity.toString());
    await page
      .locator('select[name="recurrence"]')
      .selectOption("FREQ=WEEKLY;BYDAY=MO,WE,FR");

    const anchorDate = new Date(Date.now() + 86400000);
    await page
      .locator('input[type="datetime-local"]')
      .fill(anchorDate.toISOString().slice(0, 16));

    await page.locator('button:has-text("Create")').click();

    const eventRows = page.locator('[data-testid="event-row"]');
    await expect(eventRows).toHaveCount(3);
  });

  test("should inherit series properties in new events", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    const seriesLocation = await firstSeries
      .locator('[data-testid="series-location"]')
      .textContent();
    await firstSeries.click();

    const createEventButton = page.locator('button:has-text("Create Event")');
    await createEventButton.click();

    const locationInput = page.locator('input[name="location"]');
    const locationValue = await locationInput.inputValue();

    expect(locationValue).toBe(seriesLocation);
  });

  test("should allow overriding series location in individual event", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const editButton = firstEventRow.locator('button:has-text("Edit")');
    await editButton.click();

    const locationInput = page.locator('input[name="location"]');
    const customLocation = "Custom Location " + Date.now();
    await locationInput.clear();
    await locationInput.fill(customLocation);

    await page.locator('button:has-text("Save")').click();

    await expect(firstEventRow).toContainText(customLocation);
  });

  test("should display event count for series", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();

    await expect(
      firstSeries.locator('[data-testid="event-count"]')
    ).toContainText(/\d+/);
  });
});
