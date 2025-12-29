import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";
import { EventSeriesApiService } from "@eventlane/shared";
import { EventSocketService } from "@eventlane/shared";
import { ToastService } from "@eventlane/shared";
import { EventSeries, UpdateEventSeriesRequest } from "@eventlane/shared";
import { EventDetail } from "@eventlane/shared";
import { EventDelta } from "@eventlane/shared";
import { DeltaProcessorService } from "@eventlane/shared";
import { EventDetailStore } from "@eventlane/shared";
import {
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from "@eventlane/shared";
import { HlmButtonDirective } from "@eventlane/shared";
import { HlmBadgeDirective } from "@eventlane/shared";
import { TimezoneSelectorComponent } from "@eventlane/shared";
import { formatEventDateTime } from "@eventlane/shared";
import { UserPreferencesService } from "@eventlane/shared";
import { environment } from "../../../environments/environment";

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
    TimezoneSelectorComponent,
  ],
  templateUrl: "./admin-series-detail.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSeriesDetailComponent implements OnInit, OnDestroy {
  private seriesApi = inject(EventSeriesApiService);
  private socket = inject(EventSocketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);
  private preferencesService = inject(UserPreferencesService);
  private deltaProcessor = inject(DeltaProcessorService);
  private eventStore = inject(EventDetailStore);

  language = this.preferencesService.language;

  series = signal<EventSeries | null>(null);
  events = signal<EventDetail[]>([]);
  loading = signal(true);
  eventDetail = this.eventStore.event;
  eventLoading = this.eventStore.loading;
  editingSettings = signal(false);
  creatingEvent = signal(false);
  slug = "";

  isOneOff = computed(() => {
    const s = this.series();
    return s ? s.interval === null : false;
  });

  hasSingleEvent = computed(() => {
    return this.isOneOff() && this.events().length === 1;
  });

  singleEvent = computed(() => {
    const evts = this.events();
    if (this.isOneOff() && evts.length === 1) {
      return evts[0];
    }
    return null;
  });

  editLeadWeeks = 0;
  editAutoGenerate = false;
  editEndDate = "";

  newEventDateTime = "";
  newEventCapacity = 8;
  newEventTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
        // If it's a one-off event, load events and redirect to the event page
        if (series.interval === null) {
          this.loadEventsForOneOff();
        } else {
          this.loadEvents();
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadEventsForOneOff() {
    this.seriesApi.getEvents(this.slug).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
        this.subscribeToEventUpdates(events);
        
        // If there's exactly one event, load it in EventDetailStore for inline display
        if (events.length === 1) {
          this.eventStore.init(events[0].slug);
        }
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
    const seriesDeltas = deltas.filter(
      (d) =>
        d.type === "EventSeriesCreated" ||
        d.type === "EventSeriesUpdated" ||
        d.type === "EventSeriesDeleted"
    );

    for (const delta of seriesDeltas) {
      const currentSeries = this.series();
      if (currentSeries) {
        const updated = this.deltaProcessor.applySeriesDelta(
          currentSeries,
          delta
        );
        if (updated) {
          this.series.set(updated);
        }
      }
    }

    const eventDeltas = deltas.filter(
      (d) =>
        d.type !== "EventSeriesCreated" &&
        d.type !== "EventSeriesUpdated" &&
        d.type !== "EventSeriesDeleted"
    );

    let currentEvents = this.events();
    for (const delta of eventDeltas) {
      if (delta.type === "EventCreated" && "eventSlug" in delta) {
        const series = this.series();
        if (series) {
          const updated = this.deltaProcessor.applyEventListDelta(
            currentEvents,
            delta
          );
          if (updated) {
            currentEvents = updated;
            const newEvent = updated.find((e) => e.slug === delta.eventSlug);
            if (newEvent && !this.eventSubscriptions.has(newEvent.slug)) {
              const subscription = this.socket
                .subscribeToEvent(newEvent.slug)
                .subscribe({
                  next: (deltas) => this.handleDeltas(deltas),
                });
              this.eventSubscriptions.set(newEvent.slug, subscription);
            }
          }
        }
      } else if (delta.type === "EventDeleted" && "eventSlug" in delta) {
        const updated = this.deltaProcessor.applyEventListDelta(
          currentEvents,
          delta
        );
        if (updated) {
          currentEvents = updated;
          this.eventSubscriptions.get(delta.eventSlug)?.unsubscribe();
          this.eventSubscriptions.delete(delta.eventSlug);
        }
      } else {
        const updated = this.deltaProcessor.applyEventListDelta(
          currentEvents,
          delta
        );
        if (updated) {
          currentEvents = updated;
        }
      }
    }

    this.events.set(currentEvents);
  }

  ngOnDestroy() {
    this.eventSubscriptions.forEach((sub) => sub.unsubscribe());
    this.eventSubscriptions.clear();
    this.seriesSubscription?.unsubscribe();
    this.socket.unsubscribeFromSeries(this.slug);
    // Clean up event store if we loaded an event for one-off display
    if (this.isOneOff() && this.events().length === 1) {
      this.eventStore.destroy();
    }
  }

  navigateToEvent(eventSlug: string) {
    this.router.navigate(["/events", this.slug, eventSlug]);
  }

  navigateBack() {
    this.router.navigate(["/events"]);
  }

  editSeries() {
    const s = this.series();
    if (!s) return;

    // Only set leadWeeks and autoGenerate for recurring series
    if (!this.isOneOff()) {
      this.editLeadWeeks = s.leadWeeks;
      this.editAutoGenerate = s.autoGenerate;
    }
    this.editEndDate = s.endDate
      ? new Date(s.endDate).toISOString().split("T")[0]
      : "";
    this.editingSettings.set(true);
  }

  saveSettings() {
    const payload: UpdateEventSeriesRequest = {
      endDate: this.editEndDate ? new Date(this.editEndDate).getTime() : null,
    };

    // Only include leadWeeks and autoGenerate for recurring series
    if (!this.isOneOff()) {
      payload.leadWeeks = this.editLeadWeeks;
      payload.autoGenerate = this.editAutoGenerate;
    }

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

    const confirmMessage = this.translate.instant("adminSeries.deleteConfirm", {
      count: futureCount,
    });

    if (confirm(confirmMessage)) {
      this.seriesApi.deleteSeries(this.slug).subscribe({
        next: () => {
          this.toastService.success(
            this.translate.instant("adminSeries.seriesDeleted")
          );
          this.router.navigate(["/events"]);
        },
        error: () => {
          this.toastService.error(
            this.translate.instant("adminSeries.seriesDeleteFailed")
          );
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
    if (!interval) return this.translate.instant("adminSeries.oneTime");
    if (interval === "P7D") return this.translate.instant("adminSeries.weekly");
    if (interval === "P14D")
      return this.translate.instant("adminSeries.biweekly");
    if (interval === "P1M")
      return this.translate.instant("adminSeries.monthly");

    const customDays = interval.match(/^P(\d+)D$/);
    if (!customDays) return this.translate.instant("adminSeries.recurring");

    const customInterval = customDays[1];
    return this.translate.instant("adminSeries.customInterval {{interval}}", {
      interval: customInterval,
    });
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
    const currentSeries = this.series();
    const lastEvent = this.events()[this.events().length - 1];

    this.newEventTimezone =
      lastEvent?.timezone ||
      currentSeries?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;
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

  formatEventDateTime(timestamp: number, timezone: string) {
    return formatEventDateTime(timestamp, timezone, this.language());
  }

  getEventLink() {
    const evt = this.singleEvent();
    if (!evt) return "";
    return `${environment.userUrl}/${evt.slug}`;
  }

  shareEvent() {
    const url = this.getEventLink();
    navigator.clipboard.writeText(url);
    this.toastService.success(this.translate.instant("adminEvent.linkCopied"));
  }
}
