import {
  Injectable,
  signal,
  computed,
  inject,
  PLATFORM_ID,
  TransferState,
  makeStateKey,
} from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { Router } from "@angular/router";
import { firstValueFrom, Subscription } from "rxjs";

import { EventSeries } from "@eventlane/shared";
import { EventDelta, EventSeriesDeletedDelta } from "@eventlane/shared";
import { EventSeriesApiService } from "@eventlane/shared";
import { EventSocketService } from "@eventlane/shared";
import { DeltaProcessorService } from "../services/delta-processor.service";

@Injectable({ providedIn: "root" })
export class EventSeriesDetailStore {
  private api = inject(EventSeriesApiService);
  private socket = inject(EventSocketService);
  private route = inject(Router);
  private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);
  private deltaProcessor = inject(DeltaProcessorService);

  private readonly _series = signal<EventSeries | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  private deltaSub?: Subscription;
  private currentSlug?: string;

  readonly series = computed(() => this._series());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async init(slug: string): Promise<void> {
    this.currentSlug = slug;

    const STATE_KEY = makeStateKey<EventSeries>(`series-${slug}`);

    const transferredSeries = this.transferState.get(STATE_KEY, null);

    if (transferredSeries) {
      this._series.set(transferredSeries);
      this._loading.set(false);

      this.transferState.remove(STATE_KEY);

      if (isPlatformBrowser(this.platformId)) {
        const delta$ = this.socket.subscribeToSeries(slug);
        this.deltaSub = delta$.subscribe((deltas) => {
          this.applyDeltas(deltas);
        });
      }

      return;
    }

    this._series.set(null);
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.api.getSeries(slug));
      this._series.set(data);

      if (isPlatformServer(this.platformId)) {
        this.transferState.set(STATE_KEY, data);
      }

      if (isPlatformBrowser(this.platformId)) {
        const delta$ = this.socket.subscribeToSeries(slug);
        this.deltaSub = delta$.subscribe((deltas) => {
          this.applyDeltas(deltas);
        });
      }
    } catch (err) {
      this._error.set("Failed to load series");
      console.error(err);
      this.route.navigate(["/events"]);
    } finally {
      this._loading.set(false);
    }
  }

  async reload(): Promise<void> {
    if (!this.currentSlug) return;

    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.api.getSeries(this.currentSlug));
      this._series.set(data);
    } catch (err) {
      this._error.set("Failed to reload series");
      console.error(err);
    } finally {
      this._loading.set(false);
    }
  }

  destroy() {
    if (this.currentSlug) {
      this.socket.unsubscribeFromSeries(this.currentSlug);
      this.currentSlug = undefined;
    }
    this.deltaSub?.unsubscribe();
    this.deltaSub = undefined;
  }

  private applyDeltas(deltas: EventDelta[]) {
    let series = this._series();
    if (!series) return;

    for (const delta of deltas) {
      if (delta.type === "EventSeriesDeleted") {
        const seriesDeleted = delta as EventSeriesDeletedDelta;
        if (seriesDeleted.seriesSlug === series.slug) {
          this.route.navigate(["/events"]);
          return;
        }
      }

      if (
        delta.type === "EventSeriesCreated" ||
        delta.type === "EventSeriesUpdated" ||
        delta.type === "EventSeriesDeleted"
      ) {
        const updated = this.deltaProcessor.applySeriesDelta(series, delta);
        if (updated && updated !== series) {
          series = updated;
          this._series.set(series);
        }
      }
    }
  }
}
