import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  EventSeries,
  CreateEventSeriesRequest,
  UpdateEventSeriesRequest,
} from "../models/event-series.model";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class EventSeriesApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/admin/series`;

  listSeries(): Observable<EventSeries[]> {
    return this.http.get<EventSeries[]>(this.baseUrl);
  }

  getSeries(slug: string): Observable<EventSeries> {
    return this.http.get<EventSeries>(`${this.baseUrl}/${slug}`);
  }

  createSeries(request: CreateEventSeriesRequest): Observable<EventSeries> {
    return this.http.post<EventSeries>(this.baseUrl, request);
  }

  updateSeries(
    slug: string,
    request: UpdateEventSeriesRequest
  ): Observable<EventSeries> {
    return this.http.patch<EventSeries>(`${this.baseUrl}/${slug}`, request);
  }

  deleteSeries(slug: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${slug}`);
  }

  addAdmin(slug: string, email: string): Observable<EventSeries> {
    return this.http.post<EventSeries>(`${this.baseUrl}/${slug}/admins`, {
      email,
    });
  }

  removeAdmin(slug: string, email: string): Observable<EventSeries> {
    return this.http.delete<EventSeries>(
      `${this.baseUrl}/${slug}/admins/${email}`
    );
  }
}
