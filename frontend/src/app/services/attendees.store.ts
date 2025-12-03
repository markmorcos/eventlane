import { inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { Attendees } from "../models/event.models";

import { ApiService } from "./api.service";
import { WebSocketService } from "./websocket.service";

@Injectable({ providedIn: "root" })
export class AttendeesStore {
  private apiService = inject(ApiService);
  private wsService = inject(WebSocketService);

  readonly attendees = signal<Attendees>({ confirmed: [], waitlisted: [] });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAttendees(slug: string, eventId: string): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const attendees = await firstValueFrom(
        this.apiService.getAttendees(slug)
      );
      this.attendees.set(attendees);

      this.wsService.connect();
      this.wsService.subscribe(
        `/topic/event/${eventId}/attendees`,
        (attendees: Attendees) => this.attendees.set(attendees)
      );
    } catch (error) {
      this.error.set(`Failed to load attendees: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  async removeAttendee(slug: string, attendeeId: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      await firstValueFrom(this.apiService.removeAttendee(slug, attendeeId));
    } catch (error) {
      this.error.set(`Failed to remove attendee: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }
}
