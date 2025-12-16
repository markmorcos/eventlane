import { Component, signal, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

import { HlmButtonDirective } from "../../ui/ui-button-helm/src";

@Component({
  selector: "app-cookie-banner",
  imports: [RouterLink, TranslateModule, HlmButtonDirective],
  templateUrl: "./cookie-banner.component.html",
})
export class CookieBannerComponent {
  private platformId = inject(PLATFORM_ID);
  showBanner = signal(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const consent = localStorage.getItem("cookieConsent");
      if (!consent) {
        this.showBanner.set(true);
      }
    }
  }

  acceptCookies() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem("cookieConsent", "accepted");
      localStorage.setItem("cookieConsentDate", new Date().toISOString());
      this.showBanner.set(false);
    }
  }

  declineCookies() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem("cookieConsent", "declined");
      localStorage.setItem("cookieConsentDate", new Date().toISOString());
      this.showBanner.set(false);
    }
  }
}
