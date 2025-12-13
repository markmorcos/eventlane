import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { EventSeriesApiService } from "../../services/event-series-api.service";
import { EventSeries } from "../../models/event-series.model";
import { EventDetail } from "../../models/event.model";
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
export class AdminSeriesDetailComponent implements OnInit {
  private seriesApi = inject(EventSeriesApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  series = signal<EventSeries | null>(null);
  events = signal<EventDetail[]>([]);
  loading = signal(true);
  slug = "";

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
      },
      error: () => {
        this.loading.set(false);
      },
    });
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
