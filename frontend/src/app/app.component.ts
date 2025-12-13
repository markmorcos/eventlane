import { Component, inject } from "@angular/core";
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
  private router = inject(Router);

  authLoading = this.authService.authLoading;
  isLandingPage = false;

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLandingPage = ["/", ""].includes(event.url);
      });
  }
}
