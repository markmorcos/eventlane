import { test, expect } from "../fixtures/auth.fixture";
import { DataFactory } from "../helpers/data.factory";

test.describe("Admin Attendee Management", () => {
  test("should display attendee list for an event", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const viewAttendeesButton = firstEventRow.locator(
      'button:has-text("Attendees")'
    );
    await viewAttendeesButton.click();

    await expect(page.locator('[data-testid="attendees-list"]')).toBeVisible();
  });

  test("should manually add an attendee", async ({ page, adminUser }) => {
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

    const attendee = DataFactory.createAttendee();

    await page.locator('input[name="name"]').fill(attendee.name);
    await page.locator('input[name="email"]').fill(attendee.email);

    await page.locator('button:has-text("Add")').click();

    await expect(page.locator('[data-testid="attendees-list"]')).toContainText(
      attendee.name
    );
  });

  test("should remove an attendee", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const viewAttendeesButton = firstEventRow.locator(
      'button:has-text("Attendees")'
    );
    await viewAttendeesButton.click();

    const firstAttendee = page.locator('[data-testid="attendee-row"]').first();
    const attendeeName = await firstAttendee
      .locator('[data-testid="attendee-name"]')
      .textContent();

    const removeButton = firstAttendee.locator('button:has-text("Remove")');
    await removeButton.click();

    await page.locator('button:has-text("Confirm")').click();

    await expect(
      page.locator('[data-testid="attendees-list"]')
    ).not.toContainText(attendeeName || "");
  });

  test("should update attendee count in event row", async ({
    page,
    adminUser,
  }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const initialCount = await firstEventRow
      .locator('[data-testid="attendee-count"]')
      .textContent();

    const viewAttendeesButton = firstEventRow.locator(
      'button:has-text("Attendees")'
    );
    await viewAttendeesButton.click();

    const addButton = page.locator('button:has-text("Add Attendee")');
    await addButton.click();

    const attendee = DataFactory.createAttendee();

    await page.locator('input[name="name"]').fill(attendee.name);
    await page.locator('input[name="email"]').fill(attendee.email);

    await page.locator('button:has-text("Add")').click();

    await page.goBack();

    const updatedCount = await firstEventRow
      .locator('[data-testid="attendee-count"]')
      .textContent();
    expect(parseInt(updatedCount || "0")).toBe(
      parseInt(initialCount || "0") + 1
    );
  });

  test("should prevent adding attendee when event is at capacity", async ({
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
    await capacityInput.fill("1");

    await page.locator('button:has-text("Save")').click();

    const viewAttendeesButton = firstEventRow.locator(
      'button:has-text("Attendees")'
    );
    await viewAttendeesButton.click();

    const attendeeCount = await page
      .locator('[data-testid="attendee-row"]')
      .count();

    if (attendeeCount >= 1) {
      const addButton = page.locator('button:has-text("Add Attendee")');
      await expect(addButton).toBeDisabled();
    }
  });

  test("should export attendee list", async ({ page, adminUser }) => {
    await page.goto("/admin/events");
    const firstSeries = page.locator('[data-testid="series-card"]').first();
    await firstSeries.click();

    const firstEventRow = page.locator('[data-testid="event-row"]').first();
    const viewAttendeesButton = firstEventRow.locator(
      'button:has-text("Attendees")'
    );
    await viewAttendeesButton.click();

    const downloadPromise = page.waitForEvent("download");
    const exportButton = page.locator('button:has-text("Export")');
    await exportButton.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});
