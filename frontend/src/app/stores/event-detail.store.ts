import {
  Injectable,
  signal,
  computed,
  inject,
  PLATFORM_ID,
  TransferState,
  makeStateKey,
} from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { Router } from "@angular/router";
import { firstValueFrom, Subscription } from "rxjs";

import { EventDetail } from "../models/event.model";
import {
  EventDelta,
  AttendeeAddedDelta,
  AttendeeRemovedDelta,
  AttendeeStatusChangedDelta,
  EventCapacityUpdatedDelta,
  AdminAddedDelta,
  AdminRemovedDelta,
  EventDateTimeUpdatedDelta,
  EventLocationUpdatedDelta,
  EventDescriptionUpdatedDelta,
  EventCoverImageUpdatedDelta,
} from "../models/event-delta.model";
import { EventApiService } from "../services/event-api.service";
import { EventSocketService } from "../services/event-socket.service";
import { AuthService } from "../services/auth.service";
import { ToastService } from "../services/toast.service";

@Injectable({ providedIn: "root" })
export class EventDetailStore {
  private api = inject(EventApiService);
  private socket = inject(EventSocketService);
  private auth = inject(AuthService);
  private route = inject(Router);
  private toast = inject(ToastService);
  private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);

  private userEmail = this.auth.userEmail;
  private readonly _event = signal<EventDetail | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private deltaSub?: Subscription;
  private currentSlug?: string;

  readonly event = computed(() => this._event());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async init(slug: string): Promise<void> {
    this.currentSlug = slug;

    // Create a unique key for this specific event
    const STATE_KEY = makeStateKey<EventDetail>(`event-${slug}`);

    // Check if we have transferred state from SSR
    const transferredEvent = this.transferState.get(STATE_KEY, null);

    if (transferredEvent) {
      // We have data from SSR, use it immediately
      this._event.set(transferredEvent);
      this._loading.set(false);

      // Remove the transferred state to free memory
      this.transferState.remove(STATE_KEY);

      // Subscribe to WebSocket for real-time updates (browser only)
      if (isPlatformBrowser(this.platformId)) {
        const delta$ = this.socket.subscribeToEvent(slug);
        this.deltaSub = delta$.subscribe((deltas) => {
          this.applyDeltas(deltas);
        });
      }

      return;
    }

    // No transferred state, fetch from API
    this._event.set(null);
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.api.getEvent(slug));
      this._event.set(data);

      // On server, store the data for transfer to client
      if (isPlatformServer(this.platformId)) {
        this.transferState.set(STATE_KEY, data);
      }

      // Subscribe to WebSocket (browser only)
      if (isPlatformBrowser(this.platformId)) {
        const delta$ = this.socket.subscribeToEvent(slug);
        this.deltaSub = delta$.subscribe((deltas) => {
          this.applyDeltas(deltas);
        });
      }
    } catch (err) {
      this._error.set("Failed to load event");
      console.error(err);
      this.route.navigate(["/events"]);
    } finally {
      this._loading.set(false);
    }
  }

  async reload(): Promise<void> {
    if (!this.currentSlug) return;

    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.api.getEvent(this.currentSlug));
      this._event.set(data);
    } catch (err) {
      this._error.set("Failed to reload event");
      console.error(err);
    } finally {
      this._loading.set(false);
    }
  }

  destroy() {
    if (this.currentSlug) {
      this.socket.unsubscribeFromEvent(this.currentSlug);
      this.currentSlug = undefined;
    }
    this.deltaSub?.unsubscribe();
    this.deltaSub = undefined;
  }

  private applyDeltas(deltas: EventDelta[]) {
    let event = this._event();
    if (!event) return;

    if (deltas[0] && event && deltas[0].version < event.version) return;
    for (const delta of deltas) {
      event = this.applyDelta(event, delta);
    }

    this._event.set(event);
  }

  private applyDelta(event: EventDetail, delta: EventDelta): EventDetail {
    switch (delta.type) {
      case "EventCapacityUpdated": {
        const d = delta as EventCapacityUpdatedDelta;
        return { ...event, capacity: d.newCapacity };
      }

      case "EventDeleted": {
        this.route.navigate(["/events"]);
        return event;
      }

      case "AttendeeAdded": {
        const d = delta as AttendeeAddedDelta;
        const isAdmin = event.isAdmin === true;

        const requesterStatus =
          d.attendee.email === this.userEmail()
            ? d.status
            : event.requesterStatus;

        if (!isAdmin) {
          return {
            ...event,
            requesterStatus,
            confirmedCount:
              d.status === "CONFIRMED"
                ? event.confirmedCount + 1
                : event.confirmedCount,

            waitlistedCount:
              d.status === "WAITLISTED"
                ? event.waitlistedCount + 1
                : event.waitlistedCount,

            confirmed: [],
            waitlisted: [],
          };
        }

        let confirmed = event.confirmed ?? [];
        let waitlisted = event.waitlisted ?? [];

        if (d.status === "CONFIRMED") {
          confirmed = [...confirmed, d.attendee];
        } else {
          waitlisted = [...waitlisted, d.attendee];
        }

        confirmed = confirmed.sort((a, b) =>
          a.joinedAt.localeCompare(b.joinedAt)
        );
        waitlisted = waitlisted.sort((a, b) =>
          a.joinedAt.localeCompare(b.joinedAt)
        );

        return {
          ...event,
          requesterStatus,
          confirmed,
          waitlisted,
          confirmedCount: confirmed.length,
          waitlistedCount: waitlisted.length,
        };
      }

      case "AttendeeRemoved": {
        const d = delta as AttendeeRemovedDelta;
        const isAdmin = event.isAdmin === true;

        const requesterStatus =
          d.attendeeEmail === this.userEmail()
            ? undefined
            : event.requesterStatus;

        if (!isAdmin) {
          const wasConfirmed = event.requesterStatus === "CONFIRMED";
          const wasWaitlisted = event.requesterStatus === "WAITLISTED";

          return {
            ...event,
            requesterStatus,
            confirmedCount: wasConfirmed
              ? event.confirmedCount - 1
              : event.confirmedCount,
            waitlistedCount: wasWaitlisted
              ? event.waitlistedCount - 1
              : event.waitlistedCount,
            confirmed: [],
            waitlisted: [],
          };
        }

        let confirmed = (event.confirmed ?? []).filter(
          (a) => a.email !== d.attendeeEmail
        );

        let waitlisted = (event.waitlisted ?? []).filter(
          (a) => a.email !== d.attendeeEmail
        );

        confirmed = confirmed.sort((a, b) =>
          a.joinedAt.localeCompare(b.joinedAt)
        );
        waitlisted = waitlisted.sort((a, b) =>
          a.joinedAt.localeCompare(b.joinedAt)
        );

        return {
          ...event,
          requesterStatus,
          confirmed,
          waitlisted,
          confirmedCount: confirmed.length,
          waitlistedCount: waitlisted.length,
        };
      }

      case "AttendeeStatusChanged": {
        const d = delta as AttendeeStatusChangedDelta;

        const isCurrentUser = d.attendeeEmail === this.userEmail();
        const fromConfirmed = d.oldStatus === "CONFIRMED";
        const toConfirmed = d.newStatus === "CONFIRMED";
        const requesterStatus = isCurrentUser
          ? d.newStatus
          : event.requesterStatus;

        if (!event.isAdmin) {
          return {
            ...event,
            requesterStatus,
            confirmedCount: fromConfirmed
              ? event.confirmedCount - 1
              : event.confirmedCount + 1,
            waitlistedCount: fromConfirmed
              ? event.waitlistedCount + 1
              : event.waitlistedCount - 1,
          };
        }

        let confirmed = [...event.confirmed!];
        let waitlisted = [...event.waitlisted!];

        const removeFrom = fromConfirmed ? confirmed : waitlisted;
        const addTo = toConfirmed ? confirmed : waitlisted;

        const idx = removeFrom.findIndex((a) => a.email === d.attendeeEmail);
        if (idx === -1) return event;

        const [attendee] = removeFrom.splice(idx, 1);
        if (fromConfirmed) {
          addTo.unshift(attendee);
        } else {
          addTo.push(attendee);
        }

        if (fromConfirmed) {
          confirmed = removeFrom;
          waitlisted = addTo.sort((a, b) =>
            a.joinedAt.localeCompare(b.joinedAt)
          );
        } else {
          waitlisted = removeFrom;
          confirmed = addTo.sort((a, b) =>
            a.joinedAt.localeCompare(b.joinedAt)
          );
        }

        return {
          ...event,
          confirmed,
          waitlisted,
          requesterStatus,
          confirmedCount: confirmed.length,
          waitlistedCount: waitlisted.length,
        };
      }

      case "AdminAdded": {
        const d = delta as AdminAddedDelta;
        const admins = event.admins || [];
        const isAffected = d.adminEmail === this.userEmail();
        const isAdmin = isAffected ? true : event.isAdmin;
        return { ...event, isAdmin, admins: [...admins, d.adminEmail] };
      }

      case "AdminRemoved": {
        const d = delta as AdminRemovedDelta;
        const admins = (event.admins || []).filter((a) => a !== d.adminEmail);
        const isAffected = d.adminEmail === this.userEmail();
        const isAdmin = isAffected ? false : event.isAdmin;
        if (isAffected) {
          this.route.navigate(["/events", event.slug]);
        }
        return { ...event, isAdmin, admins };
      }

      case "EventDateTimeUpdated": {
        const d = delta as EventDateTimeUpdatedDelta;
        return { ...event, eventDate: d.eventDate, timezone: d.timezone };
      }

      case "EventLocationUpdated": {
        const d = delta as EventLocationUpdatedDelta;
        return { ...event, location: d.location || undefined };
      }

      case "EventDescriptionUpdated": {
        const d = delta as EventDescriptionUpdatedDelta;
        return { ...event, description: d.description || undefined };
      }

      case "EventCoverImageUpdated": {
        const d = delta as EventCoverImageUpdatedDelta;
        return { ...event, coverImages: d.coverImages || undefined };
      }

      default:
        return event;
    }
  }

  async attend(slug: string, name: string): Promise<void> {
    await firstValueFrom(this.api.attend(slug, name));
    this.toast.success("Successfully registered for event!");
  }

  async cancel(slug: string, email: string): Promise<void> {
    await firstValueFrom(this.api.cancelAttendance(slug, email));
    this.toast.success("RSVP cancelled successfully");
  }

  async updateCapacity(slug: string, capacity: number): Promise<void> {
    await firstValueFrom(this.api.updateCapacity(slug, capacity));
    this.toast.success("Capacity updated successfully");
  }

  async addAdmin(slug: string, email: string): Promise<void> {
    await firstValueFrom(this.api.addAdmin(slug, email));
    this.toast.success("Admin added successfully");
  }

  async removeAdmin(slug: string, email: string): Promise<void> {
    await firstValueFrom(this.api.removeAdmin(slug, email));
    this.toast.success("Admin removed successfully");
  }

  async deleteEvent(slug: string): Promise<void> {
    await firstValueFrom(this.api.deleteEvent(slug));
    this.toast.success("Event deleted successfully");
  }
}
