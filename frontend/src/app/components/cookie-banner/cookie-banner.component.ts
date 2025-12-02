import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-cookie-banner",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./cookie-banner.component.html",
  styleUrls: ["./cookie-banner.component.scss"],
})
export class CookieBannerComponent {
  showBanner = signal(false);

  ngOnInit() {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      this.showBanner.set(true);
    }
  }

  acceptCookies() {
    localStorage.setItem("cookieConsent", "accepted");
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    this.showBanner.set(false);
  }

  declineCookies() {
    localStorage.setItem("cookieConsent", "declined");
    localStorage.setItem("cookieConsentDate", new Date().toISOString());
    this.showBanner.set(false);
  }
}
