import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { ApiService } from "./api.service";
import { WebSocketService } from "./websocket.service";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root",
})
export class AdminsStore {
  private apiService = inject(ApiService);
  private wsService = inject(WebSocketService);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly admins = signal<string[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAdmins(slug: string, consecutiveLoad = false) {
    try {
      this.loading.set(true);
      this.error.set(null);

      const admins = await firstValueFrom(this.apiService.getAdmins(slug));
      this.admins.set(admins);

      if (consecutiveLoad) return;

      this.wsService.connect();
      this.wsService.subscribe(
        `/topic/event/${slug}/admins`,
        (admins: string[]) => this.admins.set(admins)
      );
      this.wsService.subscribe(
        `/topic/event/${slug}/admin-removed`,
        ({ email }: { email: string }) => {
          this.admins.set(
            this.admins().filter(
              (admin) => admin.toLowerCase() !== email.toLowerCase()
            )
          );

          const currentUserEmail = this.authService.currentUser()?.email;
          if (email.toLowerCase() === currentUserEmail?.toLowerCase()) {
            this.router.navigate(["/events", slug]);
          }
        }
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
