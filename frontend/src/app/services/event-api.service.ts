import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import { EventDetail, EventSummary, Attendee } from "../models/event.model";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class EventApiService {
  private http = inject(HttpClient);
  private adminsBaseUrl = `${environment.apiBaseUrl}/admin/events`;
  private eventsBaseUrl = `${environment.apiBaseUrl}/events`;
  private attendancesBaseUrl = `${environment.apiBaseUrl}/attendances`;

  getManagedEvents() {
    return this.http.get<EventSummary[]>(this.eventsBaseUrl);
  }

  getEvent(slug: string) {
    return this.http.get<EventDetail>(`${this.eventsBaseUrl}/${slug}`);
  }

  createEvent(payload: { slug: string; title: string; capacity: number }) {
    return this.http.post<EventDetail>(this.eventsBaseUrl, payload);
  }

  attend(slug: string, name: string) {
    return this.http.post<{ status: string; attendee: Attendee }>(
      `${this.attendancesBaseUrl}/${slug}/attend`,
      { name },
    );
  }

  cancelAttendance(slug: string, email: string) {
    return this.http.delete(
      `${this.attendancesBaseUrl}/${slug}/attend/${encodeURIComponent(email)}`,
    );
  }

  updateCapacity(slug: string, capacity: number) {
    return this.http.post(`${this.adminsBaseUrl}/${slug}/capacity`, {
      capacity,
    });
  }

  addAdmin(slug: string, email: string) {
    return this.http.post(
      `${this.adminsBaseUrl}/${slug}/admins/${encodeURIComponent(email)}`,
      {},
    );
  }

  removeAdmin(slug: string, email: string) {
    return this.http.delete(
      `${this.adminsBaseUrl}/${slug}/admins/${encodeURIComponent(email)}`,
    );
  }

  deleteEvent(slug: string) {
    return this.http.delete(`${this.adminsBaseUrl}/${slug}`);
  }
}
