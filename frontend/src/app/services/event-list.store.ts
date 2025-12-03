import { inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { EventSummary, CreateEventRequest } from "../models/event.models";

import { ApiService } from "./api.service";

@Injectable({ providedIn: "root" })
export class EventListStore {
  private apiService = inject(ApiService);

  readonly events = signal<EventSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAllEvents() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const events = await firstValueFrom(this.apiService.getAllEvents());
      this.events.set(events);
    } catch (error) {
      this.error.set(`Failed to load events: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  async createEvent(request: CreateEventRequest) {
    try {
      this.loading.set(true);
      this.error.set(null);

      const event = await firstValueFrom(this.apiService.createEvent(request));
      return event;
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      this.loading.set(false);
    }

    return null;
  }
}
