import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Subscription } from "rxjs";

import { AuthService } from "@eventlane/shared";
import { EventSeriesApiService } from "@eventlane/shared";
import { EventSocketService } from "@eventlane/shared";
import { EventSeries } from "@eventlane/shared";
import { EventDelta } from "@eventlane/shared";
import { DeltaProcessorService } from "@eventlane/shared";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSeriesListComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private seriesApi = inject(EventSeriesApiService);
  private socket = inject(EventSocketService);
  private router = inject(Router);
  private preferencesService = inject(UserPreferencesService);
  private translate = inject(TranslateService);
  private deltaProcessor = inject(DeltaProcessorService);

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
    if (
      ![
        "EventSeriesCreated",
        "EventSeriesUpdated",
        "EventSeriesDeleted",
      ].includes(delta.type)
    )
      return;

    const current = this.series();
    const updated = this.deltaProcessor.applySeriesListDelta(current, delta);

    if (updated) {
      this.series.set(updated);
    }
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
