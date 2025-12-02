import { Injectable, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { WebSocketService } from "./websocket.service";
import * as Models from "../models/event.models";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class EventStateService {
  readonly events = signal<Models.EventSummary[]>([]);
  readonly currentEvent = signal<Models.EventDetail | null>(null);
  readonly currentAttendees = signal<Models.Attendees>({
    confirmed: [],
    waitlisted: [],
  });
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(
    private apiService: ApiService,
    private wsService: WebSocketService
  ) {
    this.loadAllEvents();
  }

  async loadAllEvents(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const events = await firstValueFrom(this.apiService.getAllEvents());
      this.events.set(events || []);
    } catch (err: any) {
      console.error("Error loading events:", err);
      this.error.set("Failed to load events");
    } finally {
      this.loading.set(false);
    }
  }

  async loadEvent(slug: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const event = await firstValueFrom(this.apiService.getEvent(slug));
      this.currentEvent.set(event!);

      this.wsService.connect();

      this.wsService.subscribe(
        `/topic/event/${event!.id}/summary`,
        async (summary: Models.EventSummary) => {
          console.log("Received WebSocket summary update", summary);
          try {
            const updatedEvent = await firstValueFrom(
              this.apiService.getEvent(slug)
            );
            this.currentEvent.set(updatedEvent!);
          } catch (err) {
            console.error("Error reloading event after WebSocket update:", err);
          }
        }
      );
    } catch (err: any) {
      console.error("Error loading event:", err);
      this.error.set("Failed to load event");
    } finally {
      this.loading.set(false);
    }
  }

  async loadAttendees(slug: string, eventId: string): Promise<void> {
    try {
      const attendees = await firstValueFrom(
        this.apiService.getAttendees(slug)
      );
      this.currentAttendees.set(attendees!);

      this.wsService.connect();

      this.wsService.subscribe(
        `/topic/event/${eventId}/attendees`,
        (attendees: Models.Attendees) => {
          console.log("Received WebSocket attendees update", attendees);
          this.currentAttendees.set(attendees);
        }
      );
    } catch (err: any) {
      console.error("Error loading attendees:", err);
    }
  }

  leaveEventRoom(): void {
    const currentEventId = this.currentEvent()?.id;
    if (currentEventId) {
      this.wsService.unsubscribe(`/topic/event/${currentEventId}/summary`);
      this.wsService.unsubscribe(`/topic/event/${currentEventId}/attendees`);
    }

    this.currentEvent.set(null);
    this.currentAttendees.set({ confirmed: [], waitlisted: [] });
  }

  async createEvent(
    request: Models.CreateEventRequest
  ): Promise<Models.EventDetail> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const event = await firstValueFrom(this.apiService.createEvent(request));
      await this.loadAllEvents();
      return event!;
    } catch (err: any) {
      console.error("Error creating event:", err);
      this.error.set(err.error?.message || "Failed to create event");
      throw err;
    } finally {
      this.loading.set(false);
    }
  }
}
