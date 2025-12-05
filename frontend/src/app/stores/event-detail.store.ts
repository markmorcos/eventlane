import { Injectable, signal, computed, inject } from "@angular/core";
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
} from "../models/event-delta.model";
import { EventApiService } from "../services/event-api.service";
import { EventSocketService } from "../services/event-socket.service";
import { AuthService } from "../services/auth.service";

@Injectable({ providedIn: "root" })
export class EventDetailStore {
  private api = inject(EventApiService);
  private socket = inject(EventSocketService);
  private auth = inject(AuthService);
  private route = inject(Router);

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

    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.api.getEvent(slug));
      this._event.set(data);

      const delta$ = this.socket.subscribeToEvent(slug);
      this.deltaSub = delta$.subscribe((deltas) => {
        this.applyDeltas(deltas);
      });
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

  destroy(): void {
    if (this.currentSlug) {
      this.socket.unsubscribeFromEvent(this.currentSlug);
      this.currentSlug = undefined;
    }
    this.deltaSub?.unsubscribe();
    this.deltaSub = undefined;
  }

  private applyDeltas(deltas: EventDelta[]): void {
    let current = this._event();
    if (!current) return;

    for (const delta of deltas) {
      current = this.applyDelta(current, delta);
    }

    this._event.set(current);
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
          a.createdAt.localeCompare(b.createdAt)
        );
        waitlisted = waitlisted.sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt)
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
          a.createdAt.localeCompare(b.createdAt)
        );
        waitlisted = waitlisted.sort((a, b) =>
          a.createdAt.localeCompare(b.createdAt)
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
        if (!event.confirmed || !event.waitlisted) return event;

        const fromConfirmed = d.oldStatus === "CONFIRMED";
        const toConfirmed = d.newStatus === "CONFIRMED";

        let confirmed = [...event.confirmed];
        let waitlisted = [...event.waitlisted];

        const removeFrom = fromConfirmed ? confirmed : waitlisted;
        const addTo = toConfirmed ? confirmed : waitlisted;

        const idx = removeFrom.findIndex((a) => a.email === d.attendeeEmail);
        if (idx === -1) return event;

        const [attendee] = removeFrom.splice(idx, 1);
        addTo.push(attendee);

        if (fromConfirmed) {
          confirmed = removeFrom;
          waitlisted = addTo;
        } else {
          waitlisted = removeFrom;
          confirmed = addTo;
        }

        return {
          ...event,
          confirmed,
          waitlisted,
          requesterStatus:
            attendee.email === this.userEmail() ? d.newStatus : undefined,
          confirmedCount: confirmed.length,
          waitlistedCount: waitlisted.length,
        };
      }

      case "AdminAdded": {
        const d = delta as AdminAddedDelta;
        if (!event.admins) return event;
        if (event.admins.includes(d.adminEmail)) return event;
        return { ...event, admins: [...event.admins, d.adminEmail] };
      }

      case "AdminRemoved": {
        const d = delta as AdminRemovedDelta;
        if (!event.admins) return event;
        return {
          ...event,
          admins: event.admins.filter((a) => a !== d.adminEmail),
        };
      }

      default:
        return event;
    }
  }

  async attend(slug: string, name: string): Promise<void> {
    await firstValueFrom(this.api.attend(slug, name));
  }

  async cancel(slug: string, email: string): Promise<void> {
    await firstValueFrom(this.api.cancelAttendance(slug, email));
  }

  async updateCapacity(slug: string, capacity: number): Promise<void> {
    await firstValueFrom(this.api.updateCapacity(slug, capacity));
  }

  async addAdmin(slug: string, email: string): Promise<void> {
    await firstValueFrom(this.api.addAdmin(slug, email));
  }

  async removeAdmin(slug: string, email: string): Promise<void> {
    await firstValueFrom(this.api.removeAdmin(slug, email));
  }

  async deleteEvent(slug: string): Promise<void> {
    await firstValueFrom(this.api.deleteEvent(slug));
  }
}
