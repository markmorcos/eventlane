import { test, expect } from "../fixtures/auth.fixture";
import { DataFactory } from "../helpers/data.factory";

test.describe("Admin Event Management", () => {
  test("should display all event series in admin view", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    await expect(page.locator('[data-testid="series-list"]')).toBeVisible();
  });

  test("should create a new event series", async ({ page, adminUser }) => {
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

    await page.locator('button:has-text("Create")').click();

    await expect(page).toHaveURL(/\/admin\/events\/[a-z0-9-]+/);
  });

  test("should view series detail with events", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    await expect(page).toHaveURL(/\/admin\/events\/[a-z0-9-]+/);
    await expect(page.locator('[data-testid="series-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="events-table"]')).toBeVisible();
  });

  test("should create a new event in series", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const createEventButton = page.locator('button:has-text("Create Event")');
    await createEventButton.click();

    const eventData = DataFactory.createEvent();

    await page.locator('input[name="title"]').fill(eventData.title);
    await page
      .locator('textarea[name="description"]')
      .fill(eventData.description);

    await page.locator('button:has-text("Create")').click();

    await expect(page.locator('[data-testid="events-table"]')).toContainText(
      eventData.title
    );
  });

  test("should edit event capacity", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const editButton = firstEventRow.locator('button:has-text("Edit")');
    await editButton.click();

    const capacityInput = page.locator('input[name="capacity"]');
    await capacityInput.clear();
    await capacityInput.fill("50");

    await page.locator('button:has-text("Save")').click();

    await expect(firstEventRow).toContainText("50");
  });

  test("should edit event date and time", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const editButton = firstEventRow.locator('button:has-text("Edit")');
    await editButton.click();

    const dateInput = page.locator('input[type="datetime-local"]');
    const newDate = new Date(Date.now() + 86400000 * 7);
    await dateInput.fill(newDate.toISOString().slice(0, 16));

    await page.locator('button:has-text("Save")').click();

    await expect(firstEventRow).toContainText(newDate.toLocaleDateString());
  });

  test("should delete an event", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const eventTitle = await firstEventRow
      .locator('[data-testid="event-title"]')
      .textContent();

    const deleteButton = firstEventRow.locator('button:has-text("Delete")');
    await deleteButton.click();

    await page.locator('button:has-text("Confirm")').click();

    await expect(
      page.locator('[data-testid="events-table"]')
    ).not.toContainText(eventTitle || "");
  });

  test("should delete an event series", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    const seriesTitle = await firstSeries
      .locator('[data-testid="series-title"]')
      .textContent();
    await firstSeries.click();

    const deleteSeriesButton = page.locator('button:has-text("Delete Series")');
    await deleteSeriesButton.click();

    await page.locator('button:has-text("Confirm")').click();

    await expect(page).toHaveURL("/admin/events");
    await expect(page.locator('[data-testid="series-list"]')).not.toContainText(
      seriesTitle || ""
    );
  });

  test("should update series recurrence rule", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const editSeriesButton = page.locator('button:has-text("Edit Series")');
    await editSeriesButton.click();

    const recurrenceSelect = page.locator('select[name="recurrence"]');
    await recurrenceSelect.selectOption("FREQ=WEEKLY;BYDAY=TU,TH");

    await page.locator('button:has-text("Save")').click();

    await expect(
      page.locator('[data-testid="recurrence-display"]')
    ).toContainText("Tuesday, Thursday");
  });

  test("should validate event capacity is positive", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const createEventButton = page.locator('button:has-text("Create Event")');
    await createEventButton.click();

    const capacityInput = page.locator('input[name="capacity"]');
    await capacityInput.fill("-10");

    await page.locator('button:has-text("Create")').click();

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      /positive|greater than/i
    );
  });

  test("should validate event date is in the future", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const createEventButton = page.locator('button:has-text("Create Event")');
    await createEventButton.click();

    const dateInput = page.locator('input[type="datetime-local"]');
    const pastDate = new Date(Date.now() - 86400000);
    await dateInput.fill(pastDate.toISOString().slice(0, 16));

    await page.locator('button:has-text("Create")').click();

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      /future|past/i
    );
  });
});
