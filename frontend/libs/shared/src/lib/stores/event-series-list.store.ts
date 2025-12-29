import {
  Injectable,
  computed,
  signal,
  inject,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { firstValueFrom, Subscription } from "rxjs";

import { EventSeriesApiService } from "@eventlane/shared";
import { EventSeries } from "@eventlane/shared";
import { EventSocketService } from "@eventlane/shared";
import { AuthService } from "@eventlane/shared";
import {
  EventDelta,
  EventSeriesCreatedDelta,
  EventSeriesUpdatedDelta,
  EventSeriesDeletedDelta,
} from "@eventlane/shared";
import { DeltaProcessorService } from "../services/delta-processor.service";

@Injectable({ providedIn: "root" })
export class EventSeriesListStore {
  private api = inject(EventSeriesApiService);
  private socket = inject(EventSocketService);
  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private deltaProcessor = inject(DeltaProcessorService);

  private userEmail = this.auth.userEmail;

  private readonly _series = signal<EventSeries[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private userSubscription?: Subscription;

  readonly series = computed(() => this._series());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async loadSeries() {
    this._series.set([]);
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.api.listSeries());
      this._series.set(data);

      if (isPlatformBrowser(this.platformId)) {
        this.subscribeToUpdates();
      }
    } catch (error) {
      this._error.set("Failed to load series");
      console.error(error);
    } finally {
      this._loading.set(false);
    }
  }

  destroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      this.userSubscription = undefined;
      this.socket.unsubscribeFromUserNotifications();
    }
  }

  private subscribeToUpdates() {
    const email = this.userEmail();
    if (!email) return;

    if (!this.userSubscription) {
      const userDelta$ = this.socket.subscribeToUserNotifications(email);
      this.userSubscription = userDelta$.subscribe((deltas) => {
        this.applyDeltas(deltas);
      });
    }
  }

  private applyDeltas(deltas: EventDelta[]) {
    const seriesDeltas = deltas.filter(
      (d) =>
        d.type === "EventSeriesCreated" ||
        d.type === "EventSeriesUpdated" ||
        d.type === "EventSeriesDeleted"
    );

    if (seriesDeltas.length === 0) return;

    let series = this._series();

    for (const delta of seriesDeltas) {
      const updated = this.deltaProcessor.applySeriesListDelta(series, delta);
      if (updated) {
        series = updated;
      }
    }

    if (series !== this._series()) {
      this._series.set(series);
    }
  }
}
