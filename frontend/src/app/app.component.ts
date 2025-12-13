import {
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import {
  Router,
  NavigationEnd,
  RouterOutlet,
  RouterLink,
} from "@angular/router";
import { filter } from "rxjs/operators";

import { AuthService } from "./services/auth.service";
import { AuthButtonComponent } from "./components/auth-button/auth-button.component";
import { CookieBannerComponent } from "./components/cookie-banner/cookie-banner.component";
import { ToastContainerComponent } from "./components/toast-container/toast-container.component";
import { FooterComponent } from "./components/landing/footer/footer.component";
import { LanguageSelectorComponent } from "./components/language-selector/language-selector.component";
import { UserPreferencesService } from "./services/user-preferences.service";

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

  private isBrowser = signal(false);

  isInitializing = computed(
    () =>
      !this.isBrowser() ||
      this.authService.authLoading() ||
      this.userPreferencesService.userPreferencesLoading()
  );
  isLandingPage = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isBrowser.set(true);
    }

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLandingPage = ["/", ""].includes(event.url);
      });
  }
}
