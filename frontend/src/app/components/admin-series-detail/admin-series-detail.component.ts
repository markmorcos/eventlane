import { Component, inject, OnInit, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { EventSeriesApiService } from "../../services/event-series-api.service";
import { EventSocketService } from "../../services/event-socket.service";
import { ToastService } from "../../services/toast.service";
import {
  EventSeries,
  UpdateEventSeriesRequest,
} from "../../models/event-series.model";
import { EventDetail } from "../../models/event.model";
import {
  EventDelta,
  EventCreatedDelta,
  EventCapacityUpdatedDelta,
  EventDateTimeUpdatedDelta,
  AttendeeAddedDelta,
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
    FormsModule,
    RouterModule,
    TranslateModule,
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
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  series = signal<EventSeries | null>(null);
  events = signal<EventDetail[]>([]);
  loading = signal(true);
  editingSettings = signal(false);
  creatingEvent = signal(false);
  slug = "";

  editLeadWeeks = 0;
  editAutoGenerate = false;
  editEndDate = "";

  newEventDateTime = "";
  newEventCapacity = 50;
  newEventTimezone = "";

  private eventSubscriptions = new Map<string, Subscription>();
  private seriesSubscription?: Subscription;

  ngOnInit() {
    this.slug = this.route.snapshot.paramMap.get("slug") || "";
    this.loadSeriesAndEvents();

    this.seriesSubscription = this.socket
      .subscribeToSeries(this.slug)
      .subscribe({
        next: (deltas) => this.handleDeltas(deltas),
      });
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
        const series = this.series();
        const lastEvent = currentEvents[currentEvents.length - 1];

        if (!series || !lastEvent) {
          this.loadEvents();
          break;
        }

        const d = delta as EventCreatedDelta;

        const newEvent: EventDetail = {
          slug: delta.eventSlug,
          title: series.title,
          capacity: d.capacity,
          eventDate: new Date(d.eventDate).getTime(),
          timezone: d.timezone,
          location: undefined,
          description: undefined,
          coverImages: undefined,
          confirmedCount: 0,
          waitlistedCount: 0,
          creatorEmail: series.creatorEmail,
          isAdmin: true,
          seriesSlug: series.slug,
          createdAt: new Date().toISOString(),
          version: 0,
        };

        const updated = [...currentEvents, newEvent].sort(
          (a, b) => a.eventDate - b.eventDate
        );
        this.events.set(updated);

        const subscription = this.socket
          .subscribeToEvent(newEvent.slug)
          .subscribe({
            next: (deltas) => this.handleDeltas(deltas),
          });
        this.eventSubscriptions.set(newEvent.slug, subscription);
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
    this.seriesSubscription?.unsubscribe();
    this.socket.unsubscribeFromSeries(this.slug);
  }

  navigateToEvent(eventSlug: string) {
    this.router.navigate(["/admin/events", this.slug, eventSlug]);
  }

  navigateBack() {
    this.router.navigate(["/admin/events"]);
  }

  editSeries() {
    const s = this.series();
    if (!s) return;

    this.editLeadWeeks = s.leadWeeks;
    this.editAutoGenerate = s.autoGenerate;
    this.editEndDate = s.endDate
      ? new Date(s.endDate).toISOString().split("T")[0]
      : "";
    this.editingSettings.set(true);
  }

  saveSettings() {
    const payload: UpdateEventSeriesRequest = {
      leadWeeks: this.editLeadWeeks,
      autoGenerate: this.editAutoGenerate,
      endDate: this.editEndDate ? new Date(this.editEndDate).getTime() : null,
    };

    this.seriesApi.updateSeries(this.slug, payload).subscribe({
      next: (updated) => {
        this.series.set(updated);
        this.editingSettings.set(false);
        this.toastService.success(
          this.translate.instant("adminSeries.settingsUpdated")
        );
      },
      error: () => {
        this.toastService.error(
          this.translate.instant("adminSeries.settingsUpdateFailed")
        );
      },
    });
  }

  cancelEdit() {
    this.editingSettings.set(false);
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

  openCreateEvent() {
    const lastEvent = this.events()[this.events().length - 1];
    this.newEventTimezone = lastEvent?.timezone || "UTC";
    this.newEventDateTime = "";
    this.newEventCapacity = lastEvent?.capacity || 50;
    this.creatingEvent.set(true);
  }

  createEvent() {
    if (!this.newEventDateTime) {
      this.toastService.error("Please provide date and time");
      return;
    }

    const eventDate = new Date(this.newEventDateTime).toISOString();

    this.seriesApi
      .createEvent(this.slug, {
        capacity: this.newEventCapacity,
        eventDate: eventDate,
        timezone: this.newEventTimezone,
      })
      .subscribe({
        next: () => {
          this.creatingEvent.set(false);
          this.toastService.success(
            this.translate.instant("adminSeries.eventCreated")
          );
        },
        error: () => {
          this.toastService.error(
            this.translate.instant("adminSeries.eventCreationFailed")
          );
        },
      });
  }

  cancelCreateEvent() {
    this.creatingEvent.set(false);
  }
}
