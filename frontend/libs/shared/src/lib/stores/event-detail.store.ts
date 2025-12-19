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

import { EventDetail } from "@eventlane/shared";
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
} from "@eventlane/shared";
import { EventApiService } from "@eventlane/shared";
import { EventSocketService } from "@eventlane/shared";
import { AuthService } from "@eventlane/shared";
import { ToastService } from "@eventlane/shared";
import { DeltaProcessorService } from "../services/delta-processor.service";

@Injectable({ providedIn: "root" })
export class EventDetailStore {
  private api = inject(EventApiService);
  private socket = inject(EventSocketService);
  private auth = inject(AuthService);
  private route = inject(Router);
  private toast = inject(ToastService);
  private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);
  private deltaProcessor = inject(DeltaProcessorService);

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

    const eventDeltas = deltas.filter(
      (d) =>
        d.type !== "EventSeriesCreated" &&
        d.type !== "EventSeriesUpdated" &&
        d.type !== "EventSeriesDeleted"
    );

    for (const delta of eventDeltas) {
      let event = this._event();
      if (!event) break;

      const updated = this.deltaProcessor.applyEventDelta(event, delta);

      if (updated && updated !== event) {
        event = updated;

        event = this.updateRequesterStatus(event, delta);

        this._event.set(event);

        if (delta.type === "EventDeleted") {
          this.route.navigate(["/events"]);
          return;
        }
      }
    }
  }

  private updateRequesterStatus(
    event: EventDetail,
    delta: EventDelta
  ): EventDetail {
    const userEmail = this.userEmail();

    switch (delta.type) {
      case "AttendeeAdded": {
        const d = delta as AttendeeAddedDelta;
        if (d.attendee.email === userEmail) {
          return { ...event, requesterStatus: d.status };
        }
        break;
      }

      case "AttendeeRemoved": {
        const d = delta as AttendeeRemovedDelta;
        if (d.attendeeEmail === userEmail) {
          return { ...event, requesterStatus: undefined };
        }
        break;
      }

      case "AttendeeStatusChanged": {
        const d = delta as AttendeeStatusChangedDelta;
        if (d.attendeeEmail === userEmail) {
          return { ...event, requesterStatus: d.newStatus };
        }
        break;
      }

      case "AdminAdded": {
        const d = delta as AdminAddedDelta;
        if (d.adminEmail === userEmail) {
          return { ...event, isAdmin: true };
        }
        break;
      }

      case "AdminRemoved": {
        const d = delta as AdminRemovedDelta;
        if (d.adminEmail === userEmail) {
          return { ...event, isAdmin: false };
        }
        break;
      }
    }

    return event;
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
