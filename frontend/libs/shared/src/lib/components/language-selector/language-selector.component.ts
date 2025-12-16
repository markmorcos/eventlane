import { Component, inject } from "@angular/core";
import { UserPreferencesService } from "../../services/user-preferences.service";

@Component({
  selector: "app-language-selector",
  imports: [],
  templateUrl: "./language-selector.component.html",
  styleUrl: "./language-selector.component.scss",
})
export class LanguageSelectorComponent {
  private preferencesService = inject(UserPreferencesService);

  readonly language = this.preferencesService.language;

  setLanguage(lang: "en" | "de") {
    this.preferencesService.setLanguage(lang);
  }
}
