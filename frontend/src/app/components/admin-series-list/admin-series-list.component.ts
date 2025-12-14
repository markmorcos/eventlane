import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

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
import { UserPreferencesService } from "../../services/user-preferences.service";

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
    TranslateModule,
  ],
  templateUrl: "./admin-series-list.component.html",
})
export class AdminSeriesListComponent implements OnInit {
  private seriesApi = inject(EventSeriesApiService);
  private router = inject(Router);
  private preferencesService = inject(UserPreferencesService);
  private translate = inject(TranslateService);

  language = this.preferencesService.language;

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
    if (!date) return this.translate.instant("adminSeries.noUpcomingEvents");
    return new Date(date).toLocaleDateString(this.language(), {
      month: "short",
      day: "numeric",
      year: "numeric",
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
}
