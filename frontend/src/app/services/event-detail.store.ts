import { inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { EventDetail } from "../models/event.models";

import { ApiService } from "./api.service";
import { WebSocketService } from "./websocket.service";
import { AuthService } from "./auth.service";

@Injectable({ providedIn: "root" })
export class EventDetailStore {
  private apiService = inject(ApiService);
  private wsService = inject(WebSocketService);
  private authService = inject(AuthService);

  readonly event = signal<EventDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadEvent(slug: string, consecutiveLoad = false) {
    try {
      this.loading.set(true);
      this.error.set(null);

      const event = await firstValueFrom(this.apiService.getEvent(slug));
      this.event.set(event);

      if (consecutiveLoad) return;

      this.wsService.connect();
      this.wsService.subscribe(
        `/topic/event/${event!.id}/details`,
        async (event: EventDetail) => this.loadEvent(slug, true)
      );
    } catch (error) {
      this.error.set(`Failed to load event: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  async updateCapacity(newCapacity: number) {
    try {
      this.loading.set(true);
      this.error.set(null);

      const currentEvent = this.event();
      if (!currentEvent) throw new Error("No event loaded");

      await firstValueFrom(
        this.apiService.updateCapacity(currentEvent.slug, {
          capacity: newCapacity,
        })
      );
    } catch (error) {
      this.error.set(`Failed to update capacity: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteEvent(slug: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      await firstValueFrom(this.apiService.deleteEvent(slug));
      this.event.set(null);
    } catch (error) {
      this.error.set(`Failed to delete event: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  leaveEventRoom() {
    const currentEventId = this.event()?.id;
    if (currentEventId) {
      this.wsService.unsubscribe(`/topic/event/${currentEventId}/summary`);
      this.wsService.unsubscribe(`/topic/event/${currentEventId}/attendees`);
      this.wsService.unsubscribe(`/topic/event/${currentEventId}/admins`);
    }

    this.event.set(null);
  }
}
