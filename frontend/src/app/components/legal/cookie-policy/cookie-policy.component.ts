import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

import { UserPreferencesService } from "../../../services/user-preferences.service";

@Component({
  selector: "app-cookie-policy",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./cookie-policy.component.html",
})
export class CookiePolicyComponent {
  private userPreferencesService = inject(UserPreferencesService);
  language = this.userPreferencesService.language;
}
