import { Injectable, computed, signal, inject } from "@angular/core";
import { EventApiService } from "../services/event-api.service";
import { EventSummary } from "../models/event.model";
import { firstValueFrom } from "rxjs";
import { EventSocketService } from "../services/event-socket.service";
import { ToastService } from "../services/toast.service";

@Injectable({ providedIn: "root" })
export class EventListStore {
  private api = inject(EventApiService);
  private toast = inject(ToastService);

  private readonly _events = signal<EventSummary[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly events = computed(() => this._events());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async loadManagedEvents(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const data = await firstValueFrom(this.api.getManagedEvents());
      this._events.set(data);
    } catch (err: any) {
      this._error.set("Failed to load events");
      console.error(err);
    } finally {
      this._loading.set(false);
    }
  }

  async createEvent(eventData: {
    title: string;
    slug: string;
    capacity: number;
  }) {
    this._loading.set(true);
    this._error.set(null);

    try {
      const newEvent = await firstValueFrom(this.api.createEvent(eventData));
      this._events.update((events) => [newEvent, ...events]);
      return newEvent;
    } catch (err: any) {
      this._error.set("Failed to create event");
      console.error(err);
      return null;
    } finally {
      this._loading.set(false);
    }
  }
}
