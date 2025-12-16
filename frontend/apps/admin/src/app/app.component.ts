import { Component, computed, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { RouterOutlet, RouterLink } from "@angular/router";

import {
  AuthService,
  AuthButtonComponent,
  ToastContainerComponent,
  LanguageSelectorComponent,
  UserPreferencesService,
} from "@eventlane/shared";

@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    RouterLink,
    AuthButtonComponent,
    ToastContainerComponent,
    LanguageSelectorComponent,
  ],
  template: `
    @if (!isInitializing()) {
    <div class="min-h-screen flex flex-col">
      <header class="sticky top-0 z-50 bg-background border-b border-border">
        <div
          class="container mx-auto px-4 py-4 flex items-center justify-between"
        >
          <a routerLink="/" class="text-2xl font-bold">EventLane Admin</a>
          <div class="flex items-center gap-4">
            <app-language-selector />
            <app-auth-button />
          </div>
        </div>
      </header>

      <main class="flex-1">
        <router-outlet />
      </main>
    </div>

    <app-toast-container />
    }
  `,
})
export class AppComponent {
  private authService = inject(AuthService);
  private userPreferencesService = inject(UserPreferencesService);
  private platformId = inject(PLATFORM_ID);

  isInitializing = computed(
    () =>
      !isPlatformBrowser(this.platformId) ||
      this.authService.authLoading() ||
      this.userPreferencesService.userPreferencesLoading()
  );
}
