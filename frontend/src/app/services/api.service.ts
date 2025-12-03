import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import {
  EventSummary,
  EventDetail,
  Attendees,
  RsvpRequest,
  RsvpResponse,
  CancelResponse,
  CreateEventRequest,
  UpdateCapacityRequest,
  UpdateCapacityResponse,
  AdminEmailRequest,
} from "../models/event.models";

@Injectable({ providedIn: "root" })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiBaseUrl;

  getAllEvents() {
    return this.http.get<EventSummary[]>(`${this.apiUrl}/events`);
  }

  getEvent(slug: string) {
    return this.http.get<EventDetail>(`${this.apiUrl}/events/${slug}`);
  }

  getAttendees(slug: string) {
    return this.http.get<Attendees>(`${this.apiUrl}/events/${slug}/attendees`);
  }

  rsvp(slug: string, request: RsvpRequest) {
    return this.http.post<RsvpResponse>(
      `${this.apiUrl}/events/${slug}/rsvp`,
      request
    );
  }

  cancel(slug: string) {
    return this.http.post<CancelResponse>(
      `${this.apiUrl}/events/${slug}/cancel`,
      {}
    );
  }

  createEvent(request: CreateEventRequest) {
    return this.http.post<EventDetail>(`${this.apiUrl}/events`, request);
  }

  updateCapacity(slug: string, request: UpdateCapacityRequest) {
    return this.http.patch<UpdateCapacityResponse>(
      `${this.apiUrl}/events/${slug}/capacity`,
      request
    );
  }

  getAdmins(slug: string) {
    return this.http.get<string[]>(`${this.apiUrl}/events/${slug}/admins`);
  }

  addAdmin(slug: string, request: AdminEmailRequest) {
    return this.http.post<void>(
      `${this.apiUrl}/events/${slug}/admins`,
      request
    );
  }

  removeAdmin(slug: string, email: string) {
    return this.http.delete(`${this.apiUrl}/events/${slug}/admins/${email}`);
  }

  removeAttendee(slug: string, attendeeId: string) {
    return this.http.delete<CancelResponse>(
      `${this.apiUrl}/events/${slug}/attendees/${attendeeId}`
    );
  }

  deleteEvent(slug: string) {
    return this.http.delete(`${this.apiUrl}/events/${slug}`);
  }
}
