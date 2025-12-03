import { Component } from "@angular/core";
import {
  Router,
  NavigationEnd,
  RouterOutlet,
  RouterLink,
} from "@angular/router";
import { filter } from "rxjs/operators";
import { CommonModule } from "@angular/common";

import { AuthButtonComponent } from "./components/auth-button/auth-button.component";
import { CookieBannerComponent } from "./components/cookie-banner/cookie-banner.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    AuthButtonComponent,
    CookieBannerComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  isLandingPage = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLandingPage = ["/", ""].includes(event.url);
      });
  }
}
