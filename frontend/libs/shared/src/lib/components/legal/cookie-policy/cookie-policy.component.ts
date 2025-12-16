import { Component, inject } from "@angular/core";

import { UserPreferencesService } from "../../../services/user-preferences.service";

@Component({
  selector: "app-cookie-policy",
  templateUrl: "./cookie-policy.component.html",
})
export class CookiePolicyComponent {
  private userPreferencesService = inject(UserPreferencesService);
  language = this.userPreferencesService.language;
}
