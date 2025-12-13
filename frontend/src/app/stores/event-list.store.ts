import {
  Injectable,
  computed,
  signal,
  inject,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { firstValueFrom, Subscription } from "rxjs";

import { EventApiService } from "../services/event-api.service";
import { EventSummary } from "../models/event.model";
import { EventOrSeriesGroup } from "../models/event-or-series-group.model";
import { EventSocketService } from "../services/event-socket.service";
import { ToastService } from "../services/toast.service";
import { AuthService } from "../services/auth.service";
import {
  EventDelta,
  EventCapacityUpdatedDelta,
  AttendeeAddedDelta,
  AttendeeRemovedDelta,
  AdminAddedDelta,
  AdminRemovedDelta,
  AttendeeStatusChangedDelta,
} from "../models/event-delta.model";

@Injectable({ providedIn: "root" })
export class EventListStore {
  private api = inject(EventApiService);
  private socket = inject(EventSocketService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  private userEmail = this.auth.userEmail;

  private readonly _eventGroups = signal<EventOrSeriesGroup[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private userSubscription?: Subscription;

  readonly eventGroups = computed(() => this._eventGroups());
  readonly events = computed(() => this._eventGroups().map((g) => g.nextEvent)); // For backward compatibility
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async loadAttendingEvents() {
    this._eventGroups.set([]);
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.api.getAttendingEvents());
      this._eventGroups.set(data);

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
    const deltasByEvent = deltas.reduce((result, delta) => {
      if (!result[delta.eventSlug]) result[delta.eventSlug] = [];
      result[delta.eventSlug].push(delta);
      return result;
    }, {} as Record<string, EventDelta[]>);

    for (const eventSlug of Object.keys(deltasByEvent)) {
      const eventDeltas = deltasByEvent[eventSlug];
      const eventGroup = this._eventGroups().find(
        (g) => g.nextEvent.slug === eventSlug
      );

      if (
        eventDeltas[0] &&
        eventGroup &&
        eventDeltas[0].version < eventGroup.nextEvent.version
      ) {
        continue;
      }

      for (const delta of eventDeltas) {
        await this.applyDelta(delta);
      }
    }
  }

  private async applyDelta(delta: EventDelta): Promise<void> {
    const groups = this._eventGroups();
    const group = groups.find((g) => g.nextEvent.slug === delta.eventSlug);

    if (!group) {
      // Event not in our list, ignore delta
      return;
    }

    let event = group.nextEvent;

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
          this._eventGroups.update((groups) =>
            groups.filter((g) => g.nextEvent.slug !== delta.eventSlug)
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
        this._eventGroups.update((groups) =>
          groups.filter((g) => g.nextEvent.slug !== delta.eventSlug)
        );
        return;
      }
    }

    if (updated) {
      this._eventGroups.update((groups) => {
        return groups.map((g) =>
          g.nextEvent.slug === delta.eventSlug
            ? { ...g, nextEvent: updated! }
            : g
        );
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
