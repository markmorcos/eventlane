import { Component, computed, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import {
  Router,
  NavigationEnd,
  RouterOutlet,
  RouterLink,
} from "@angular/router";
import { filter } from "rxjs/operators";

import {
  AuthService,
  AuthButtonComponent,
  CookieBannerComponent,
  ToastContainerComponent,
  LanguageSelectorComponent,
  UserPreferencesService,
} from "@eventlane/shared";
import { FooterComponent } from "./components/landing/footer/footer.component";

@Component({
  selector: "app-root",
  imports: [
    RouterOutlet,
    FooterComponent,
    RouterLink,
    AuthButtonComponent,
    CookieBannerComponent,
    ToastContainerComponent,
    LanguageSelectorComponent,
  ],
  templateUrl: "./app.component.html",
})
export class AppComponent {
  private authService = inject(AuthService);
  private userPreferencesService = inject(UserPreferencesService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  isInitializing = computed(
    () =>
      !isPlatformBrowser(this.platformId) ||
      this.authService.authLoading() ||
      this.userPreferencesService.userPreferencesLoading()
  );
  isLandingPage = false;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLandingPage = ["/", ""].includes(event.url);
      });
  }
}
