import { Injectable } from "@angular/core";
import {
  EventDelta,
  EventCreatedDelta,
  EventCapacityUpdatedDelta,
  EventDateTimeUpdatedDelta,
  AttendeeAddedDelta,
  AttendeeRemovedDelta,
  AttendeeStatusChangedDelta,
  AdminAddedDelta,
  AdminRemovedDelta,
  EventLocationUpdatedDelta,
  EventDescriptionUpdatedDelta,
  EventCoverImageUpdatedDelta,
  EventSeriesCreatedDelta,
  EventSeriesUpdatedDelta,
  EventSeriesDeletedDelta,
} from "../models/event-delta.model";
import { EventDetail, EventSummary } from "../models/event.model";
import { EventSeries } from "../models/event-series.model";

type DeltaHandler<T> = (state: T, delta: EventDelta) => T | null;

// Type guards for event vs series deltas
function isEventDelta(
  delta: EventDelta
): delta is
  | EventCreatedDelta
  | EventCapacityUpdatedDelta
  | EventDateTimeUpdatedDelta
  | AttendeeAddedDelta
  | AttendeeRemovedDelta
  | AttendeeStatusChangedDelta
  | AdminAddedDelta
  | AdminRemovedDelta
  | EventLocationUpdatedDelta
  | EventDescriptionUpdatedDelta
  | EventCoverImageUpdatedDelta {
  return "eventSlug" in delta;
}

function isSeriesDelta(
  delta: EventDelta
): delta is
  | EventSeriesCreatedDelta
  | EventSeriesUpdatedDelta
  | EventSeriesDeletedDelta {
  return "seriesSlug" in delta;
}

@Injectable({
  providedIn: "root",
})
export class DeltaProcessorService {
  applyEventDelta(
    event: EventDetail | null,
    delta: EventDelta
  ): EventDetail | null {
    if (!event) return null;

    if (delta.version < event.version) {
      console.warn(
        `Ignoring stale delta for ${event.slug}: delta version ${delta.version} < event version ${event.version}`
      );
      return event;
    }

    const handler = this.eventDeltaHandlers[delta.type];
    if (!handler) {
      console.warn(`Unknown delta type: ${delta.type}`);
      return event;
    }

    return handler(event, delta);
  }

  applyEventListDelta(
    events: EventDetail[],
    delta: EventDelta
  ): EventDetail[] | null {
    const handler = this.eventListDeltaHandlers[delta.type];
    if (!handler) {
      console.warn(`Unknown delta type for list: ${delta.type}`);
      return null;
    }

    return handler(events, delta);
  }

  applyEventSummaryListDelta(
    events: EventSummary[],
    delta: EventDelta
  ): EventSummary[] | null {
    const eventsAsDetail: EventDetail[] = events.map((e) => ({
      ...e,
      confirmed: undefined,
      waitlisted: undefined,
      admins: undefined,
    }));

    const handler = this.eventListDeltaHandlers[delta.type];
    if (!handler) {
      console.warn(`Unknown delta type for list: ${delta.type}`);
      return null;
    }

    const result = handler(eventsAsDetail, delta);
    if (!result) return null;

    return result.map((e) => {
      const { confirmed, waitlisted, admins, ...summary } = e;
      return summary;
    });
  }

  applySeriesDelta(
    series: EventSeries | null,
    delta: EventDelta
  ): EventSeries | null {
    if (!series) return null;

    if (
      "version" in delta &&
      typeof delta.version === "number" &&
      delta.version < series.version
    ) {
      console.warn(
        `Ignoring stale series delta: delta version ${delta.version} <= series version ${series.version}`
      );
      return series;
    }

    const handler = this.seriesDeltaHandlers[delta.type];
    if (!handler) {
      return series;
    }

    return handler(series, delta);
  }

  applySeriesListDelta(
    seriesList: EventSeries[],
    delta: EventDelta
  ): EventSeries[] | null {
    const handler = this.seriesListDeltaHandlers[delta.type];
    if (!handler) {
      return null;
    }

    return handler(seriesList, delta);
  }

  private eventDeltaHandlers: Record<string, DeltaHandler<EventDetail>> = {
    EventCapacityUpdated: (event, delta) => {
      const d = delta as EventCapacityUpdatedDelta;
      return {
        ...event,
        capacity: d.newCapacity,
        version: delta.version,
      };
    },

    EventDateTimeUpdated: (event, delta) => {
      const d = delta as EventDateTimeUpdatedDelta;
      return {
        ...event,
        eventDate: d.eventDate,
        timezone: d.timezone,
        version: delta.version,
      };
    },

    EventLocationUpdated: (event, delta) => {
      const d = delta as EventLocationUpdatedDelta;
      return {
        ...event,
        location: d.location ?? undefined,
        version: delta.version,
      };
    },

    EventDescriptionUpdated: (event, delta) => {
      const d = delta as EventDescriptionUpdatedDelta;
      return {
        ...event,
        description: d.description ?? undefined,
        version: delta.version,
      };
    },

    EventCoverImageUpdated: (event, delta) => {
      const d = delta as EventCoverImageUpdatedDelta;
      return {
        ...event,
        coverImages: d.coverImages ?? undefined,
        version: delta.version,
      };
    },

    AttendeeAdded: (event, delta) => {
      const d = delta as AttendeeAddedDelta;
      const newEvent = { ...event, version: delta.version };

      if (d.status === "CONFIRMED") {
        const existing = event.confirmed || [];
        const uniqueAttendees = [
          ...existing.filter((a) => a.email !== d.attendee.email),
          d.attendee,
        ].sort(
          (a, b) =>
            new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
        );
        newEvent.confirmed = uniqueAttendees;
        newEvent.confirmedCount = uniqueAttendees.length;
      } else {
        const existing = event.waitlisted || [];
        const uniqueAttendees = [
          ...existing.filter((a) => a.email !== d.attendee.email),
          d.attendee,
        ].sort(
          (a, b) =>
            new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
        );
        newEvent.waitlisted = uniqueAttendees;
        newEvent.waitlistedCount = uniqueAttendees.length;
      }

      return newEvent;
    },

    AttendeeRemoved: (event, delta) => {
      const d = delta as AttendeeRemovedDelta;
      const newEvent = { ...event, version: delta.version };

      if (event.confirmed) {
        const wasConfirmed = event.confirmed.some(
          (a) => a.email === d.attendeeEmail
        );
        if (wasConfirmed) {
          newEvent.confirmed = event.confirmed.filter(
            (a) => a.email !== d.attendeeEmail
          );
          newEvent.confirmedCount = Math.max(0, event.confirmedCount - 1);
        }
      }

      if (event.waitlisted) {
        const wasWaitlisted = event.waitlisted.some(
          (a) => a.email === d.attendeeEmail
        );
        if (wasWaitlisted) {
          newEvent.waitlisted = event.waitlisted.filter(
            (a) => a.email !== d.attendeeEmail
          );
          newEvent.waitlistedCount = Math.max(0, event.waitlistedCount - 1);
        }
      }

      return newEvent;
    },

    AttendeeStatusChanged: (event, delta) => {
      const d = delta as AttendeeStatusChangedDelta;
      const newEvent = { ...event, version: delta.version };

      const confirmed = event.confirmed || [];
      const waitlisted = event.waitlisted || [];

      const attendee =
        confirmed.find((a) => a.email === d.attendeeEmail) ||
        waitlisted.find((a) => a.email === d.attendeeEmail);

      if (!attendee) return event;

      if (d.newStatus === "CONFIRMED") {
        // Remove from waitlist and add to confirmed (only if not already there)
        const alreadyConfirmed = confirmed.some(
          (a) => a.email === d.attendeeEmail
        );
        newEvent.waitlisted = waitlisted.filter(
          (a) => a.email !== d.attendeeEmail
        );
        newEvent.waitlistedCount = Math.max(0, newEvent.waitlistedCount - 1);

        if (!alreadyConfirmed) {
          newEvent.confirmed = [
            ...confirmed.filter((a) => a.email !== d.attendeeEmail),
            attendee,
          ].sort(
            (a, b) =>
              new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
          );
          newEvent.confirmedCount = (event.confirmedCount || 0) + 1;
        } else {
          newEvent.confirmed = confirmed;
        }
      } else {
        // Remove from confirmed and add to waitlist (only if not already there)
        const alreadyWaitlisted = waitlisted.some(
          (a) => a.email === d.attendeeEmail
        );
        newEvent.confirmed = confirmed.filter(
          (a) => a.email !== d.attendeeEmail
        );
        newEvent.confirmedCount = Math.max(0, (event.confirmedCount || 0) - 1);

        if (!alreadyWaitlisted) {
          newEvent.waitlisted = [
            ...waitlisted.filter((a) => a.email !== d.attendeeEmail),
            attendee,
          ].sort(
            (a, b) =>
              new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
          );
          newEvent.waitlistedCount = (event.waitlistedCount || 0) + 1;
        } else {
          newEvent.waitlisted = waitlisted;
        }
      }

      return newEvent;
    },

    AdminAdded: (event, delta) => {
      const d = delta as AdminAddedDelta;
      if (!event.admins) return event;

      return {
        ...event,
        admins: [...event.admins, d.adminEmail],
        version: delta.version,
      };
    },

    AdminRemoved: (event, delta) => {
      const d = delta as AdminRemovedDelta;
      if (!event.admins) return event;

      return {
        ...event,
        admins: event.admins.filter((email) => email !== d.adminEmail),
        version: delta.version,
      };
    },
  };

  private eventListDeltaHandlers: Record<string, DeltaHandler<EventDetail[]>> =
    {
      EventCreated: (events, delta) => {
        if (!isEventDelta(delta)) return events;
        const d = delta as EventCreatedDelta;

        const newEvent: EventDetail = {
          slug: delta.eventSlug,
          title: d.title,
          capacity: d.capacity,
          eventDate: new Date(d.eventDate).getTime(),
          timezone: d.timezone,
          confirmedCount: 0,
          waitlistedCount: 0,
          creatorEmail: "",
          isAdmin: true,
          seriesSlug: "",
          createdAt: new Date().toISOString(),
          version: delta.version,
        };

        return [...events, newEvent].sort((a, b) => a.eventDate - b.eventDate);
      },

      EventDeleted: (events, delta) => {
        if (!isEventDelta(delta)) return events;
        return events.filter((e) => e.slug !== delta.eventSlug);
      },

      EventCapacityUpdated: (events, delta) => {
        if (!isEventDelta(delta)) return events;
        const d = delta as EventCapacityUpdatedDelta;
        return events.map((e) => {
          if (e.slug !== delta.eventSlug || delta.version < e.version) return e;
          return { ...e, capacity: d.newCapacity, version: delta.version };
        });
      },

      EventDateTimeUpdated: (events, delta) => {
        if (!isEventDelta(delta)) return events;
        const d = delta as EventDateTimeUpdatedDelta;
        const updated = events.map((e) => {
          if (e.slug !== delta.eventSlug || delta.version < e.version) return e;
          return {
            ...e,
            eventDate: d.eventDate,
            timezone: d.timezone,
            version: delta.version,
          };
        });
        return updated.sort((a, b) => a.eventDate - b.eventDate);
      },

      AttendeeAdded: (events, delta) => {
        if (!isEventDelta(delta)) return events;
        const d = delta as AttendeeAddedDelta;
        return events.map((e) => {
          if (e.slug !== delta.eventSlug || delta.version < e.version) return e;

          return {
            ...e,
            confirmedCount:
              d.status === "CONFIRMED"
                ? e.confirmedCount + 1
                : e.confirmedCount,
            waitlistedCount:
              d.status === "WAITLISTED"
                ? e.waitlistedCount + 1
                : e.waitlistedCount,
            version: delta.version,
          };
        });
      },

      AttendeeRemoved: (events, delta) => {
        if (!isEventDelta(delta)) return events;
        return events.map((e) => {
          if (e.slug !== delta.eventSlug || delta.version < e.version) return e;

          return {
            ...e,
            confirmedCount: Math.max(0, e.confirmedCount - 1),
            version: delta.version,
          };
        });
      },

      AttendeeStatusChanged: (events, delta) => {
        if (!isEventDelta(delta)) return events;
        const d = delta as AttendeeStatusChangedDelta;
        return events.map((e) => {
          if (e.slug !== delta.eventSlug || delta.version < e.version) return e;

          const confirmedDelta = d.newStatus === "CONFIRMED" ? 1 : -1;
          const waitlistedDelta = d.newStatus === "WAITLISTED" ? 1 : -1;

          return {
            ...e,
            confirmedCount: Math.max(0, e.confirmedCount + confirmedDelta),
            waitlistedCount: Math.max(0, e.waitlistedCount + waitlistedDelta),
            version: delta.version,
          };
        });
      },
    };

  private seriesDeltaHandlers: Record<string, DeltaHandler<EventSeries>> = {
    EventSeriesUpdated: (series, delta) => {
      if (!isSeriesDelta(delta)) return series;
      const d = delta as EventSeriesUpdatedDelta;
      return {
        ...series,
        title: d.title ?? series.title,
        interval: d.interval !== undefined ? d.interval : series.interval,
        leadWeeks: d.leadWeeks ?? series.leadWeeks,
        endDate: d.endDate !== undefined ? d.endDate : series.endDate,
        updatedAt: Date.now(),
        version: delta.version,
      };
    },
  };

  // ===== SERIES LIST DELTA HANDLERS (array of series) =====

  private seriesListDeltaHandlers: Record<string, DeltaHandler<EventSeries[]>> =
    {
      EventSeriesCreated: (seriesList, delta) => {
        if (!isSeriesDelta(delta)) return seriesList;
        const d = delta as EventSeriesCreatedDelta;

        if (seriesList.some((s) => s.slug === d.slug)) {
          return seriesList;
        }

        const newSeries: EventSeries = {
          slug: d.slug,
          title: d.title,
          anchorDate: d.anchorDate,
          timezone: d.timezone,
          interval: d.interval,
          leadWeeks: d.leadWeeks,
          autoGenerate: false,
          endDate: d.endDate,
          nextEventDate: null,
          nextEventSlug: null,
          upcomingEventsCount: 0,
          creatorEmail: d.createdBy,
          admins: [d.createdBy],
          createdAt: d.createdAt,
          updatedAt: d.createdAt,
          version: delta.version,
        };

        return [...seriesList, newSeries].sort(
          (a, b) => b.createdAt - a.createdAt
        );
      },

      EventSeriesUpdated: (seriesList, delta) => {
        const d = delta as EventSeriesUpdatedDelta;
        return seriesList.map((s) => {
          if (s.slug !== d.slug || delta.version < s.version) return s;

          return {
            ...s,
            title: d.title ?? s.title,
            interval: d.interval !== undefined ? d.interval : s.interval,
            leadWeeks: d.leadWeeks ?? s.leadWeeks,
            endDate: d.endDate !== undefined ? d.endDate : s.endDate,
            updatedAt: Date.now(),
            version: delta.version,
          };
        });
      },

      EventSeriesDeleted: (seriesList, delta) => {
        const d = delta as EventSeriesDeletedDelta;
        return seriesList.filter((s) => s.slug !== d.slug);
      },
    };
}
