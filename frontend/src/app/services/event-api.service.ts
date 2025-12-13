import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";

import {
  EventDetail,
  EventSummary,
  Attendee,
  Location,
} from "../models/event.model";
import { EventOrSeriesGroup } from "../models/event-or-series-group.model";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: "root" })
export class EventApiService {
  private http = inject(HttpClient);
  private adminsBaseUrl = `${environment.apiBaseUrl}/admin/events`;
  private eventsBaseUrl = `${environment.apiBaseUrl}/events`;
  private attendancesBaseUrl = `${environment.apiBaseUrl}/attendances`;

  getManagedEvents() {
    return this.http.get<EventOrSeriesGroup[]>(this.eventsBaseUrl);
  }

  getEvent(slug: string) {
    return this.http.get<EventOrSeriesGroup>(`${this.eventsBaseUrl}/${slug}`);
  }

  createEvent(payload: {
    title: string;
    capacity: number;
    eventDate: string;
    timezone: string;
    interval?: string | null;
    leadWeeks?: number;
    endDate?: string | null;
  }) {
    return this.http.post<EventOrSeriesGroup>(this.eventsBaseUrl, payload);
  }

  attend(slug: string, name: string) {
    return this.http.post<{ status: string; attendee: Attendee }>(
      `${this.attendancesBaseUrl}/${slug}/attend`,
      { name }
    );
  }

  cancelAttendance(slug: string, email: string) {
    return this.http.delete(
      `${this.attendancesBaseUrl}/${slug}/attend/${encodeURIComponent(email)}`
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
      {}
    );
  }

  removeAdmin(slug: string, email: string) {
    return this.http.delete(
      `${this.adminsBaseUrl}/${slug}/admins/${encodeURIComponent(email)}`
    );
  }

  deleteEvent(slug: string) {
    return this.http.delete(`${this.adminsBaseUrl}/${slug}`);
  }

  updateMetadata(
    slug: string,
    payload: {
      eventDate?: string;
      timezone?: string;
      location?: Location;
      clearLocation?: boolean;
      description?: string;
    }
  ) {
    return this.http.patch(`${this.adminsBaseUrl}/${slug}/metadata`, payload);
  }

  getImageUploadUrl(slug: string) {
    return this.http.get<{ uploadUrl: string }>(
      `${this.adminsBaseUrl}/${slug}/cover-image/upload-url`
    );
  }

  processCoverImage(slug: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.http.post(
      `${this.adminsBaseUrl}/${slug}/cover-image`,
      formData
    );
  }

  deleteCoverImage(slug: string) {
    return this.http.delete(`${this.adminsBaseUrl}/${slug}/cover-image`);
  }

  async uploadCoverImage(slug: string, blob: Blob): Promise<void> {
    const file = new File([blob], "cover.webp", { type: "image/webp" });
    await this.processCoverImage(slug, file).toPromise();
  }
}
