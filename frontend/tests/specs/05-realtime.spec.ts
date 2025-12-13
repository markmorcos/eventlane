import { test, expect } from "../fixtures/auth.fixture";

test.describe("Real-time Updates", () => {
  test("should update event capacity in real-time", async ({
    page,
    adminUser,
    context,
  }) => {
    const userPage = await context.newPage();
    await userPage.goto("/events");
    const firstEvent = userPage.locator('[data-testid="event-card"]').first();
    await firstEvent.click();

    const initialCapacity = await userPage
      .locator('[data-testid="event-capacity"]')
      .textContent();

    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const editButton = firstEventRow.locator('button:has-text("Edit")');
    await editButton.click();

    const capacityInput = page.locator('input[name="capacity"]');
    await capacityInput.clear();
    await capacityInput.fill("75");

    await page.locator('button:has-text("Save")').click();

    await expect(
      userPage.locator('[data-testid="event-capacity"]')
    ).toContainText("75", { timeout: 3000 });
    await expect(
      userPage.locator('[data-testid="event-capacity"]')
    ).not.toContainText(initialCapacity || "");
  });

  test("should update attendee count in real-time", async ({
    page,
    adminUser,
    context,
  }) => {
    const userPage = await context.newPage();
    await userPage.goto("/events");
    const firstEvent = userPage.locator('[data-testid="event-card"]').first();
    await firstEvent.click();

    const initialCount = await userPage
      .locator('[data-testid="attendee-count"]')
      .textContent();

    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const viewAttendeesButton = firstEventRow.locator(
      'button:has-text("Attendees")'
    );
    await viewAttendeesButton.click();

    const addButton = page.locator('button:has-text("Add Attendee")');
    await addButton.click();

    await page.locator('input[name="name"]').fill("Test User");
    await page.locator('input[name="email"]').fill("test@example.com");

    await page.locator('button:has-text("Add")').click();

    const expectedCount = parseInt(initialCount || "0") + 1;
    await expect(
      userPage.locator('[data-testid="attendee-count"]')
    ).toContainText(expectedCount.toString(), { timeout: 3000 });
  });

  test("should remove deleted event from user view in real-time", async ({
    page,
    adminUser,
    context,
  }) => {
    const userPage = await context.newPage();
    await userPage.goto("/events");
    const firstEvent = userPage.locator('[data-testid="event-card"]').first();
    const eventTitle = await firstEvent
      .locator('[data-testid="event-title"]')
      .textContent();

    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const deleteButton = firstEventRow.locator('button:has-text("Delete")');
    await deleteButton.click();

    await page.locator('button:has-text("Confirm")').click();

    await expect(
      userPage.locator('[data-testid="events-list"]')
    ).not.toContainText(eventTitle || "", { timeout: 3000 });
  });

  test("should show new event in user view in real-time", async ({
    page,
    adminUser,
    context,
  }) => {
    const userPage = await context.newPage();
    await userPage.goto("/events");

    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const createEventButton = page.locator('button:has-text("Create Event")');
    await createEventButton.click();

    const eventTitle = "E2E Test Event " + Date.now();

    await page.locator('input[name="title"]').fill(eventTitle);
    await page.locator('textarea[name="description"]').fill("Test description");

    await page.locator('button:has-text("Create")').click();

    await expect(userPage.locator('[data-testid="events-list"]')).toContainText(
      eventTitle,
      { timeout: 3000 }
    );
  });

  test("should update event date in real-time", async ({
    page,
    adminUser,
    context,
  }) => {
    const userPage = await context.newPage();
    await userPage.goto("/events");
    const firstEvent = userPage.locator('[data-testid="event-card"]').first();
    await firstEvent.click();

    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const editButton = firstEventRow.locator('button:has-text("Edit")');
    await editButton.click();

    const dateInput = page.locator('input[type="datetime-local"]');
    const newDate = new Date(Date.now() + 86400000 * 14);
    await dateInput.fill(newDate.toISOString().slice(0, 16));

    await page.locator('button:has-text("Save")').click();

    await expect(userPage.locator('[data-testid="event-date"]')).toContainText(
      newDate.toLocaleDateString(),
      { timeout: 3000 }
    );
  });

  test("should update event list in admin view in real-time", async ({
    page,
    adminUser,
    context,
  }) => {
    const adminPage2 = await context.newPage();

    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    const seriesSlug = await firstSeries.getAttribute("data-slug");
    await firstSeries.click();

    await adminPage2.goto(`/admin/events/${seriesSlug}`);

    const createEventButton = page.locator('button:has-text("Create Event")');
    await createEventButton.click();

    const eventTitle = "Admin E2E Test " + Date.now();

    await page.locator('input[name="title"]').fill(eventTitle);
    await page.locator('textarea[name="description"]').fill("Test");

    await page.locator('button:has-text("Create")').click();

    await expect(
      adminPage2.locator('[data-testid="events-table"]')
    ).toContainText(eventTitle, { timeout: 3000 });
  });

  test("should update capacity change in both user and admin views", async ({
    page,
    adminUser,
    context,
  }) => {
    const userPage = await context.newPage();
    const adminPage2 = await context.newPage();

    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    const seriesSlug = await firstSeries.getAttribute("data-slug");
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const eventSlug = await firstEventRow.getAttribute("data-slug");

    await userPage.goto(`/events/${eventSlug}`);
    await adminPage2.goto(`/admin/events/${seriesSlug}`);

    const editButton = firstEventRow.locator('button:has-text("Edit")');
    await editButton.click();

    const capacityInput = page.locator('input[name="capacity"]');
    await capacityInput.clear();
    await capacityInput.fill("88");

    await page.locator('button:has-text("Save")').click();

    await expect(
      userPage.locator('[data-testid="event-capacity"]')
    ).toContainText("88", { timeout: 3000 });
    await expect(
      adminPage2.locator('[data-testid="event-row"]').first()
    ).toContainText("88", { timeout: 3000 });
  });

  test("should handle multiple rapid updates correctly", async ({
    page,
    adminUser,
    context,
  }) => {
    const userPage = await context.newPage();
    await userPage.goto("/events");
    const firstEvent = userPage.locator('[data-testid="event-card"]').first();
    await firstEvent.click();

    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const editButton = firstEventRow.locator('button:has-text("Edit")');

    for (let i = 0; i < 5; i++) {
      await editButton.click();
      const capacityInput = page.locator('input[name="capacity"]');
      await capacityInput.clear();
      await capacityInput.fill((20 + i).toString());
      await page.locator('button:has-text("Save")').click();
      await page.waitForTimeout(200);
    }

    await expect(
      userPage.locator('[data-testid="event-capacity"]')
    ).toContainText("24", { timeout: 3000 });
  });
});
