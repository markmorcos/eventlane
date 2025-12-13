import { faker } from "@faker-js/faker";

export class DataFactory {
  static createEventSeries() {
    const slug = faker.helpers
      .slugify(faker.company.catchPhrase())
      .toLowerCase();
    return {
      slug,
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      location: faker.location.city(),
      timezone: "America/New_York",
      capacity: faker.number.int({ min: 10, max: 100 }),
      recurrenceRule: "FREQ=WEEKLY;BYDAY=MO",
      anchorDate: Date.now() + 86400000,
    };
  }

  static createEvent(seriesSlug?: string) {
    const slug = faker.helpers
      .slugify(faker.company.catchPhrase())
      .toLowerCase();
    return {
      slug,
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      location: faker.location.city(),
      timezone: "America/New_York",
      capacity: faker.number.int({ min: 10, max: 100 }),
      eventDate: Date.now() + 86400000 * faker.number.int({ min: 1, max: 30 }),
      seriesSlug: seriesSlug || null,
    };
  }

  static createAttendee() {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    };
  }
}
