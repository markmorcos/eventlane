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
  AttendeeAddedDelta,
  AttendeeRemovedDelta,
  AdminAddedDelta,
  AdminRemovedDelta,
  AttendeeStatusChangedDelta,
} from "@eventlane/shared";
import { DeltaProcessorService } from "../services/delta-processor.service";

@Injectable({ providedIn: "root" })
export class EventListStore {
  private api = inject(EventApiService);
  private socket = inject(EventSocketService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private deltaProcessor = inject(DeltaProcessorService);

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
    // Filter out EventSeries deltas - they're not handled here
    const eventDeltas = deltas.filter(
      (d) =>
        d.type !== "EventSeriesCreated" &&
        d.type !== "EventSeriesUpdated" &&
        d.type !== "EventSeriesDeleted"
    );

    let events = this._events();

    for (const delta of eventDeltas) {
      if (
        [
          "EventSeriesCreated",
          "EventSeriesUpdated",
          "EventSeriesDeleted",
        ].includes(delta.type)
      )
        continue;

      if (!("eventSlug" in delta)) continue;

      if (delta.type === "AdminAdded" || delta.type === "AdminRemoved") {
        await this.handleAdminDelta(delta);
        continue;
      }

      const updated = this.deltaProcessor.applyEventSummaryListDelta(
        events,
        delta
      );

      if (updated) {
        events = updated;
        events = this.updateRequesterStatus(events, delta);
        this.showAttendeeDeltaToast(delta, events);
      }
    }

    this._events.set(events);
  }

  private async handleAdminDelta(delta: EventDelta): Promise<void> {
    if (!("eventSlug" in delta)) return;

    const events = this._events();
    const event = events.find((e) => e.slug === delta.eventSlug);

    if (!event) return;

    switch (delta.type) {
      case "AdminAdded": {
        const d = delta as AdminAddedDelta;
        if (d.adminEmail !== this.userEmail()) return;

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
    }
  }

  private updateRequesterStatus(
    events: EventSummary[],
    delta: EventDelta
  ): EventSummary[] {
    const userEmail = this.userEmail();
    if (!("eventSlug" in delta)) return events;

    const event = events.find((e) => e.slug === delta.eventSlug);
    if (!event) return events;

    switch (delta.type) {
      case "AttendeeAdded": {
        const d = delta as AttendeeAddedDelta;
        if (d.attendee.email === userEmail) {
          return events.map((e) =>
            e.slug === delta.eventSlug ? { ...e, requesterStatus: d.status } : e
          );
        }
        break;
      }

      case "AttendeeRemoved": {
        const d = delta as AttendeeRemovedDelta;
        if (d.attendeeEmail === userEmail) {
          return events.map((e) =>
            e.slug === delta.eventSlug
              ? { ...e, requesterStatus: undefined }
              : e
          );
        }
        break;
      }

      case "AttendeeStatusChanged": {
        const d = delta as AttendeeStatusChangedDelta;
        if (d.attendeeEmail === userEmail) {
          return events.map((e) =>
            e.slug === delta.eventSlug
              ? { ...e, requesterStatus: d.newStatus }
              : e
          );
        }
        break;
      }
    }

    return events;
  }

  private showAttendeeDeltaToast(
    delta: EventDelta,
    events: EventSummary[]
  ): void {
    if (!("eventSlug" in delta)) return;

    const event = events.find((e) => e.slug === delta.eventSlug);
    if (!event) return;

    const userEmail = this.userEmail();

    switch (delta.type) {
      case "AttendeeRemoved": {
        const d = delta as AttendeeRemovedDelta;
        if (d.attendeeEmail === userEmail) {
          this.toast.info(
            `You have been removed from the event "${event.title}"`
          );
        }
        break;
      }

      case "AttendeeStatusChanged": {
        const d = delta as AttendeeStatusChangedDelta;
        if (d.attendeeEmail === userEmail) {
          this.toast.info(
            `Your status for the event "${
              event.title
            }" has been changed to ${d.newStatus.toLowerCase()}`
          );
        }
        break;
      }
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
