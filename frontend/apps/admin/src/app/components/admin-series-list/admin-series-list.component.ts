import { Component, inject, OnInit, OnDestroy, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";

import { AuthService } from "@eventlane/shared";
import { EventSeriesApiService } from "@eventlane/shared";
import { EventSocketService } from "@eventlane/shared";
import { EventSeries } from "@eventlane/shared";
import { EventDelta } from "@eventlane/shared";
import {
  HlmCardDirective,
  HlmCardContentDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
} from "@eventlane/shared";
import { HlmButtonDirective } from "@eventlane/shared";
import { HlmBadgeDirective } from "@eventlane/shared";
import { UserPreferencesService } from "@eventlane/shared";

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
export class AdminSeriesListComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private seriesApi = inject(EventSeriesApiService);
  private socket = inject(EventSocketService);
  private router = inject(Router);
  private preferencesService = inject(UserPreferencesService);
  private translate = inject(TranslateService);

  language = this.preferencesService.language;
  userEmail = this.authService.userEmail;

  series = signal<EventSeries[]>([]);
  loading = signal(true);

  private socketSubscription?: Subscription;

  ngOnInit() {
    this.loadSeries();
    this.subscribeToUpdates();
  }

  ngOnDestroy() {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
  }

  private subscribeToUpdates() {
    const email = this.userEmail();
    if (!email) return;

    this.socketSubscription = this.socket
      .subscribeToUserNotifications(email)
      .subscribe((deltas: EventDelta[]) => {
        console.log("Received deltas:", deltas);

        // Handle deltas inline instead of reloading
        deltas.forEach((delta) => {
          this.handleDelta(delta);
        });
      });
  }

  private handleDelta(delta: EventDelta) {
    switch (delta.type) {
      case "EventSeriesCreated":
        this.handleSeriesCreated(delta);
        break;
      case "EventSeriesUpdated":
        this.handleSeriesUpdated(delta);
        break;
      case "EventSeriesDeleted":
        this.handleSeriesDeleted(delta);
        break;
      default:
        // Ignore event-specific deltas (they're handled in detail views)
        console.log("Ignoring delta type:", delta.type);
    }
  }

  private handleSeriesCreated(delta: EventDelta) {
    if (delta.type !== "EventSeriesCreated") return;

    const newSeries: EventSeries = {
      slug: delta.slug,
      title: delta.title,
      interval: delta.interval,
      leadWeeks: delta.leadWeeks,
      autoGenerate: delta.interval !== null,
      anchorDate: delta.anchorDate,
      timezone: delta.timezone,
      endDate: delta.endDate,
      nextEventDate: null,
      nextEventSlug: null,
      upcomingEventsCount: 0,
      creatorEmail: delta.createdBy,
      admins: [delta.createdBy],
      createdAt: delta.createdAt,
      updatedAt: delta.createdAt,
      version: delta.version,
    };

    const current = this.series();
    // Insert-sort by createdAt (newest first)
    const newList = [...current, newSeries].sort(
      (a, b) => b.createdAt - a.createdAt
    );
    this.series.set(newList);
  }

  private handleSeriesUpdated(delta: EventDelta) {
    if (delta.type !== "EventSeriesUpdated") return;

    const current = this.series();
    const index = current.findIndex((s) => s.slug === delta.slug);
    if (index === -1) return;

    const existingSeries = current[index];

    // Version check - ignore stale updates
    if (delta.version <= existingSeries.version) {
      console.log(
        "Ignoring stale delta",
        delta.version,
        "<=",
        existingSeries.version
      );
      return;
    }

    const updated: EventSeries = {
      ...existingSeries,
      version: delta.version,
      title: delta.title ?? existingSeries.title,
      interval:
        delta.interval !== undefined ? delta.interval : existingSeries.interval,
      leadWeeks: delta.leadWeeks ?? existingSeries.leadWeeks,
      endDate:
        delta.endDate !== undefined ? delta.endDate : existingSeries.endDate,
    };

    const newList = [...current];
    newList[index] = updated;
    // Re-sort after update
    newList.sort((a, b) => b.createdAt - a.createdAt);
    this.series.set(newList);
  }

  private handleSeriesDeleted(delta: EventDelta) {
    if (delta.type !== "EventSeriesDeleted") return;

    const current = this.series();
    const filtered = current.filter((s) => s.slug !== delta.slug);
    this.series.set(filtered);
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
    this.router.navigate(["/events", slug]);
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
