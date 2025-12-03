import { inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { WebSocketService } from "./websocket.service";

@Injectable({
  providedIn: "root",
})
export class AdminsStore {
  private apiService = inject(ApiService);
  private wsService = inject(WebSocketService);

  readonly admins = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAdmins(slug: string, eventId: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      const admins = await firstValueFrom(this.apiService.getAdmins(slug));
      this.admins.set(admins);

      this.wsService.connect();
      this.wsService.subscribe(
        `/topic/event/${eventId}/admins`,
        (admins: string[]) => this.admins.set(admins)
      );
    } catch (error) {
      this.error.set(`Failed to load admins: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  async addAdmin(slug: string, adminEmail: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      await firstValueFrom(this.apiService.addAdmin(slug, { adminEmail }));
    } catch (error) {
      this.error.set(`Failed to add admin: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  async removeAdmin(slug: string, adminEmail: string) {
    try {
      this.loading.set(true);
      this.error.set(null);

      await firstValueFrom(this.apiService.removeAdmin(slug, adminEmail));
    } catch (error) {
      this.error.set(`Failed to remove admin: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }
}
