import { Component, inject, OnInit, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { Subscription } from "rxjs";
import { EventSeriesApiService } from "../../services/event-series-api.service";
import { EventSocketService } from "../../services/event-socket.service";
import { EventSeries } from "../../models/event-series.model";
import { EventDetail } from "../../models/event.model";
import {
  EventDelta,
  EventCapacityUpdatedDelta,
  EventDateTimeUpdatedDelta,
  AttendeeAddedDelta,
  AttendeeRemovedDelta,
  AttendeeStatusChangedDelta,
} from "../../models/event-delta.model";
import {
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from "../../ui/ui-card-helm/src";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";
import { HlmBadgeDirective } from "../../ui/ui-badge-helm/src";

@Component({
  selector: "app-admin-series-detail",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HlmCardDirective,
    HlmCardContentDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmButtonDirective,
    HlmBadgeDirective,
  ],
  templateUrl: "./admin-series-detail.component.html",
})
export class AdminSeriesDetailComponent implements OnInit, OnDestroy {
  private seriesApi = inject(EventSeriesApiService);
  private socket = inject(EventSocketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  series = signal<EventSeries | null>(null);
  events = signal<EventDetail[]>([]);
  loading = signal(true);
  slug = "";

  private eventSubscriptions = new Map<string, Subscription>();

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get("slug") || "";
    this.loadSeriesAndEvents();
  }

  loadSeriesAndEvents() {
    this.loading.set(true);

    this.seriesApi.getSeries(this.slug).subscribe({
      next: (series) => {
        this.series.set(series);
        this.loadEvents();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadEvents() {
    this.seriesApi.getEvents(this.slug).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
        this.subscribeToEventUpdates(events);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  subscribeToEventUpdates(events: EventDetail[]) {
    this.eventSubscriptions.forEach((sub) => sub.unsubscribe());
    this.eventSubscriptions.clear();

    events.forEach((event) => {
      const subscription = this.socket.subscribeToEvent(event.slug).subscribe({
        next: (deltas) => this.handleDeltas(deltas),
      });
      this.eventSubscriptions.set(event.slug, subscription);
    });
  }

  handleDeltas(deltas: EventDelta[]) {
    for (const delta of deltas) {
      this.applyDelta(delta);
    }
  }

  applyDelta(delta: EventDelta) {
    const currentEvents = this.events();

    switch (delta.type) {
      case "EventCreated": {
        this.loadEvents();
        break;
      }

      case "EventDeleted": {
        const updated = currentEvents.filter((e) => e.slug !== delta.eventSlug);
        this.events.set(updated);

        this.eventSubscriptions.get(delta.eventSlug)?.unsubscribe();
        this.eventSubscriptions.delete(delta.eventSlug);
        break;
      }

      case "EventCapacityUpdated": {
        const d = delta as EventCapacityUpdatedDelta;
        const updated = currentEvents.map((e) =>
          e.slug === delta.eventSlug ? { ...e, capacity: d.newCapacity } : e
        );
        this.events.set(updated);
        break;
      }

      case "EventDateTimeUpdated": {
        const d = delta as EventDateTimeUpdatedDelta;
        const updated = currentEvents.map((e) =>
          e.slug === delta.eventSlug
            ? { ...e, eventDate: d.eventDate, timezone: d.timezone }
            : e
        );
        this.events.set(updated.sort((a, b) => a.eventDate - b.eventDate));
        break;
      }

      case "AttendeeAdded": {
        const d = delta as AttendeeAddedDelta;
        const updated = currentEvents.map((e) => {
          if (e.slug !== delta.eventSlug) return e;

          return {
            ...e,
            confirmedCount:
              d.status === "CONFIRMED"
                ? e.confirmedCount + 1
                : e.confirmedCount,
            waitlistedCount:
              d.status === "WAITLISTED"
                ? e.waitlistedCount + 1
                : e.waitlistedCount,
          };
        });
        this.events.set(updated);
        break;
      }

      case "AttendeeRemoved": {
        const updated = currentEvents.map((e) => {
          if (e.slug !== delta.eventSlug) return e;

          return {
            ...e,
            confirmedCount: Math.max(0, e.confirmedCount - 1),
          };
        });
        this.events.set(updated);
        break;
      }

      case "AttendeeStatusChanged": {
        const d = delta as AttendeeStatusChangedDelta;
        const updated = currentEvents.map((e) => {
          if (e.slug !== delta.eventSlug) return e;

          const confirmedDelta = d.newStatus === "CONFIRMED" ? 1 : -1;
          const waitlistedDelta = d.newStatus === "WAITLISTED" ? 1 : -1;

          return {
            ...e,
            confirmedCount: Math.max(0, e.confirmedCount + confirmedDelta),
            waitlistedCount: Math.max(0, e.waitlistedCount + waitlistedDelta),
          };
        });
        this.events.set(updated);
        break;
      }
    }
  }

  ngOnDestroy() {
    this.eventSubscriptions.forEach((sub) => sub.unsubscribe());
    this.eventSubscriptions.clear();
  }

  navigateToEvent(eventSlug: string) {
    this.router.navigate(["/admin/events", this.slug, eventSlug]);
  }

  navigateBack() {
    this.router.navigate(["/admin/events"]);
  }

  deleteSeries() {
    const futureCount = this.events().filter(
      (e) => e.eventDate > Date.now()
    ).length;

    if (
      confirm(`Delete this event series and ${futureCount} future event(s)?`)
    ) {
      this.seriesApi.deleteSeries(this.slug).subscribe({
        next: () => {
          this.router.navigate(["/admin/events"]);
        },
      });
    }
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  getRecurrenceLabel(interval: string | null): string {
    if (!interval) return "One-time event";
    if (interval === "P7D") return "Weekly";
    if (interval === "P14D") return "Bi-weekly";
    if (interval === "P1M") return "Monthly";
    return `Every ${interval}`;
  }

  isPast(eventDate: number): boolean {
    return eventDate < Date.now();
  }

  get futureEvents() {
    return this.events().filter((e) => !this.isPast(e.eventDate));
  }

  get pastEvents() {
    return this.events().filter((e) => this.isPast(e.eventDate));
  }
}
