import {
  Injectable,
  computed,
  signal,
  inject,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { firstValueFrom, Subscription } from "rxjs";

import { EventApiService } from "@eventlane/shared";
import { EventSummary } from "@eventlane/shared";
import { EventSocketService } from "@eventlane/shared";
import { ToastService } from "@eventlane/shared";
import { AuthService } from "@eventlane/shared";
import {
  EventDelta,
  EventCapacityUpdatedDelta,
  AttendeeAddedDelta,
  AttendeeRemovedDelta,
  AdminAddedDelta,
  AdminRemovedDelta,
  AttendeeStatusChangedDelta,
} from "@eventlane/shared";

@Injectable({ providedIn: "root" })
export class EventListStore {
  private api = inject(EventApiService);
  private socket = inject(EventSocketService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  private userEmail = this.auth.userEmail;

  private readonly _events = signal<EventSummary[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private userSubscription?: Subscription;

  readonly events = computed(() => this._events());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async loadAttendingEvents() {
    this._events.set([]);
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.api.getAttendingEvents());
      this._events.set(data);

      if (isPlatformBrowser(this.platformId)) {
        this.subscribeToUpdates();
      }
    } catch (error) {
      this._error.set("Failed to load events");
      console.error(error);
    } finally {
      this._loading.set(false);
    }
  }

  private subscribeToUpdates(): void {
    const email = this.userEmail();
    if (!email) return;

    if (!this.userSubscription) {
      const userDelta$ = this.socket.subscribeToUserNotifications(email);
      this.userSubscription = userDelta$.subscribe(async (deltas) => {
        await this.applyDeltas(deltas);
      });
    }
  }

  private async applyDeltas(deltas: EventDelta[]): Promise<void> {
    const eventDeltas = deltas.filter(
      (d) =>
        d.type !== "EventSeriesCreated" &&
        d.type !== "EventSeriesUpdated" &&
        d.type !== "EventSeriesDeleted"
    );

    const deltasByEvent = eventDeltas.reduce((result, delta) => {
      if ("eventSlug" in delta) {
        if (!result[delta.eventSlug]) result[delta.eventSlug] = [];
        result[delta.eventSlug].push(delta);
      }
      return result;
    }, {} as Record<string, EventDelta[]>);

    for (const eventSlug of Object.keys(deltasByEvent)) {
      const eventDeltas = deltasByEvent[eventSlug];
      const event = this._events().find((e) => e.slug === eventSlug);

      if (eventDeltas[0] && event && eventDeltas[0].version < event.version) {
        continue;
      }

      for (const delta of eventDeltas) {
        await this.applyDelta(delta);
      }
    }
  }

  private async applyDelta(delta: EventDelta): Promise<void> {
    // Skip EventSeries deltas
    if (
      delta.type === "EventSeriesCreated" ||
      delta.type === "EventSeriesUpdated" ||
      delta.type === "EventSeriesDeleted"
    ) {
      return;
    }

    // Type guard: at this point we know it has eventSlug
    if (!("eventSlug" in delta)) return;

    const events = this._events();
    const event = events.find((e) => e.slug === delta.eventSlug);

    if (!event) {
      // Event not in our list, ignore delta
      return;
    }

    let updated: EventSummary | null = null;

    switch (delta.type) {
      case "EventCapacityUpdated": {
        const d = delta as EventCapacityUpdatedDelta;
        updated = { ...event, capacity: d.newCapacity };
        break;
      }

      case "AdminAdded": {
        const d = delta as AdminAddedDelta;
        if (d.adminEmail !== this.userEmail()) break;

        // Reload the full list since we may have new access
        await this.loadAttendingEvents();

        this.toast.info(`You've been added as an admin to "${event.title}"`);

        break;
      }

      case "AdminRemoved": {
        const d = delta as AdminRemovedDelta;
        if (d.adminEmail === this.userEmail()) {
          this._events.update((events) =>
            events.filter((e) => e.slug !== delta.eventSlug)
          );
          this.toast.info(
            `You've been removed as an admin from "${event.title}"`
          );
        }
        break;
      }

      case "AttendeeAdded": {
        const d = delta as AttendeeAddedDelta;
        const isCurrentUser = d.attendee.email === this.userEmail();

        updated = {
          ...event,
          requesterStatus: isCurrentUser ? d.status : event.requesterStatus,
          confirmedCount:
            d.status === "CONFIRMED"
              ? event.confirmedCount + 1
              : event.confirmedCount,
          waitlistedCount:
            d.status === "WAITLISTED"
              ? event.waitlistedCount + 1
              : event.waitlistedCount,
        };
        break;
      }

      case "AttendeeRemoved": {
        const d = delta as AttendeeRemovedDelta;

        const isCurrentUser = d.attendeeEmail === this.userEmail();
        const wasConfirmed = event.requesterStatus === "CONFIRMED";
        const wasWaitlisted = event.requesterStatus === "WAITLISTED";

        updated = {
          ...event,
          requesterStatus: isCurrentUser ? undefined : event.requesterStatus,
          confirmedCount: wasConfirmed
            ? event.confirmedCount - 1
            : event.confirmedCount,
          waitlistedCount: wasWaitlisted
            ? event.waitlistedCount - 1
            : event.waitlistedCount,
        };

        if (isCurrentUser) {
          this.toast.info(
            `You have been removed from the event "${event.title}"`
          );
        }

        break;
      }

      case "AttendeeStatusChanged": {
        const d = delta as AttendeeStatusChangedDelta;
        const isCurrentUser = d.attendeeEmail === this.userEmail();
        const fromConfirmed = d.oldStatus === "CONFIRMED";

        updated = {
          ...event,
          requesterStatus: isCurrentUser ? d.newStatus : event.requesterStatus,
          confirmedCount: fromConfirmed
            ? event.confirmedCount - 1
            : event.confirmedCount + 1,
          waitlistedCount: fromConfirmed
            ? event.waitlistedCount + 1
            : event.waitlistedCount - 1,
        };

        if (isCurrentUser) {
          this.toast.info(
            `Your status for the event "${
              event.title
            }" has been changed to ${d.newStatus.toLowerCase()}`
          );
        }
        break;
      }

      case "EventDeleted": {
        this._events.update((events) =>
          events.filter((e) => e.slug !== delta.eventSlug)
        );
        return;
      }
    }

    if (updated) {
      this._events.update((events) => {
        return events.map((e) => (e.slug === delta.eventSlug ? updated! : e));
      });
    }
  }

  destroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      this.userSubscription = undefined;
      this.socket.unsubscribeFromUserNotifications();
    }
  }
}
