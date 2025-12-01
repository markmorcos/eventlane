import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import * as Models from "../models/event.models";

@Injectable({
  providedIn: "root",
})
export class ApiService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  // Event endpoints
  getAllEvents(): Observable<Models.EventSummary[]> {
    return this.http.get<Models.EventSummary[]>(`${this.apiUrl}/events`);
  }

  getEvent(slug: string): Observable<Models.EventDetail> {
    return this.http.get<Models.EventDetail>(`${this.apiUrl}/events/${slug}`);
  }

  getAttendees(slug: string): Observable<Models.Attendees> {
    return this.http.get<Models.Attendees>(
      `${this.apiUrl}/events/${slug}/attendees`
    );
  }

  // RSVP endpoints
  rsvp(
    slug: string,
    request: Models.RsvpRequest
  ): Observable<Models.RsvpResponse> {
    return this.http.post<Models.RsvpResponse>(
      `${this.apiUrl}/events/${slug}/rsvp`,
      request
    );
  }

  cancel(slug: string): Observable<Models.CancelResponse> {
    return this.http.post<Models.CancelResponse>(
      `${this.apiUrl}/events/${slug}/cancel`,
      {}
    );
  }

  // Admin endpoints
  createEvent(
    request: Models.CreateEventRequest
  ): Observable<Models.EventDetail> {
    return this.http.post<Models.EventDetail>(`${this.apiUrl}/events`, request);
  }

  updateCapacity(
    slug: string,
    request: Models.UpdateCapacityRequest
  ): Observable<Models.UpdateCapacityResponse> {
    return this.http.patch<Models.UpdateCapacityResponse>(
      `${this.apiUrl}/events/${slug}/capacity`,
      request
    );
  }

  getAdmins(slug: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/events/${slug}/admins`);
  }

  addAdmin(slug: string, request: Models.AdminEmailRequest): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/events/${slug}/admins`,
      request
    );
  }

  removeAdmin(
    slug: string,
    request: Models.AdminEmailRequest
  ): Observable<void> {
    return this.http.request<void>(
      "delete",
      `${this.apiUrl}/events/${slug}/admins`,
      { body: request }
    );
  }

  removeAttendee(
    slug: string,
    attendeeId: string,
    promoteNext: boolean = true
  ): Observable<Models.CancelResponse> {
    return this.http.delete<Models.CancelResponse>(
      `${this.apiUrl}/events/${slug}/attendees/${attendeeId}?promoteNext=${promoteNext}`
    );
  }

  deleteEvent(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/events/${slug}`);
  }
}
