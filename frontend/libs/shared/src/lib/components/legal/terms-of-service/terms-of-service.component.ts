import { Component, inject } from "@angular/core";
import { RouterLink } from "@angular/router";

import { UserPreferencesService } from "../../../services/user-preferences.service";

@Component({
  selector: "app-terms-of-service",
  imports: [RouterLink],
  templateUrl: "./terms-of-service.component.html",
})
export class TermsOfServiceComponent {
  private userPreferencesService = inject(UserPreferencesService);
  language = this.userPreferencesService.language;
}
