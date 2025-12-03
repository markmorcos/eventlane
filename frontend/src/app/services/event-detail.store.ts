import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { EventDetail } from "../models/event.models";

import { ApiService } from "./api.service";
import { WebSocketService } from "./websocket.service";
import { EventListStore } from "./event-list.store";

@Injectable({ providedIn: "root" })
export class EventDetailStore {
  private apiService = inject(ApiService);
  private wsService = inject(WebSocketService);
  private eventListStore = inject(EventListStore);
  private router = inject(Router);

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
      this.wsService.subscribe(`/topic/event/${slug}/details`, () =>
        this.loadEvent(slug, true)
      );
      this.wsService.subscribe(`/topic/event/${slug}/deleted`, () => {
        this.eventListStore.loadAllEvents();
        this.router.navigate(["/events"]);
      });
      this.wsService.subscribe(`/topic/event/${slug}/admin-removed`, () => {
        this.loadEvent(slug, true);
      });
    } catch (error) {
      this.error.set(`Failed to load event: ${error}`);
      this.router.navigate(["/events"]);
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
    const slug = this.event()?.slug;
    if (slug) {
      this.wsService.unsubscribe(`/topic/event/${slug}/details`);
      this.wsService.unsubscribe(`/topic/event/${slug}/deleted`);
      this.wsService.unsubscribe(`/topic/event/${slug}/admin-removed`);
    }

    this.event.set(null);
  }
}
