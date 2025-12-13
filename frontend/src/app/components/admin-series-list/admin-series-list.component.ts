import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { EventSeriesApiService } from "../../services/event-series-api.service";
import { EventSeries } from "../../models/event-series.model";
import {
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from "../../ui/ui-card-helm/src";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";
import { HlmBadgeDirective } from "../../ui/ui-badge-helm/src";

@Component({
  selector: "app-admin-series-list",
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
  templateUrl: "./admin-series-list.component.html",
})
export class AdminSeriesListComponent implements OnInit {
  private seriesApi = inject(EventSeriesApiService);
  private router = inject(Router);

  series = signal<EventSeries[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadSeries();
  }

  loadSeries() {
    this.loading.set(true);
    this.seriesApi.listSeries().subscribe({
      next: (data) => {
        this.series.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  navigateToSeries(slug: string) {
    this.router.navigate(["/admin/events", slug]);
  }

  navigateToCreate() {
    this.router.navigate(["/events/create"]);
  }

  formatDate(date: number | null): string {
    if (!date) return "No upcoming events";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  getRecurrenceLabel(interval: string | null): string {
    if (!interval) return "One-time";
    if (interval === "P7D") return "Weekly";
    if (interval === "P14D") return "Bi-weekly";
    if (interval === "P1M") return "Monthly";
    return "Recurring";
  }
}
