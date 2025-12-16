import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

import { UserPreferencesService } from "../../../services/user-preferences.service";

@Component({
  selector: "app-privacy-policy",
  imports: [RouterLink],
  templateUrl: "./privacy-policy.component.html",
})
export class PrivacyPolicyComponent {
  private userPreferencesService = inject(UserPreferencesService);
  language = this.userPreferencesService.language;
}
