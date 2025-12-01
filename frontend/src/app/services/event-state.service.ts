import { Injectable, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { WebSocketService } from "./websocket.service";
import * as Models from "../models/event.models";
import { firstValueFrom, Subscription } from "rxjs";

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

  private eventSummarySubscription?: Subscription;
  private eventAttendeesSubscription?: Subscription;

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

      await this.wsService.connect();

      // Unsubscribe from previous event subscriptions
      if (this.eventSummarySubscription) {
        this.eventSummarySubscription.unsubscribe();
      }

      // Subscribe to event summary updates
      this.eventSummarySubscription = this.wsService
        .subscribe<Models.EventSummary>(`event:summary`)
        .subscribe({
          next: async (summary) => {
            console.log("Received WebSocket event:summary update", summary);
            try {
              const updatedEvent = await firstValueFrom(
                this.apiService.getEvent(slug)
              );
              this.currentEvent.set(updatedEvent!);
            } catch (err) {
              console.error(
                "Error reloading event after WebSocket update:",
                err
              );
            }
          },
          error: (err) => console.error("WebSocket error:", err),
        });

      const roomName = `event:${event!.id}`;
      this.wsService.joinRoom(roomName);
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

      await this.wsService.connect();

      // Unsubscribe from previous attendees subscriptions
      if (this.eventAttendeesSubscription) {
        this.eventAttendeesSubscription.unsubscribe();
      }

      // Subscribe to attendees updates
      this.eventAttendeesSubscription = this.wsService
        .subscribe<Models.Attendees>(`event:attendees`)
        .subscribe({
          next: (attendees) => {
            console.log("Received WebSocket event:attendees update", attendees);
            this.currentAttendees.set(attendees);
          },
          error: (err) => console.error("WebSocket error:", err),
        });

      const roomName = `event:${eventId}`;
      this.wsService.joinRoom(roomName);
    } catch (err: any) {
      console.error("Error loading attendees:", err);
    }
  }

  leaveEventRoom(): void {
    const event = this.currentEvent();
    if (event) {
      this.wsService.leaveRoom(`event:${event.id}`);
    }

    // Cleanup subscriptions
    if (this.eventSummarySubscription) {
      this.eventSummarySubscription.unsubscribe();
      this.eventSummarySubscription = undefined;
    }
    if (this.eventAttendeesSubscription) {
      this.eventAttendeesSubscription.unsubscribe();
      this.eventAttendeesSubscription = undefined;
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
