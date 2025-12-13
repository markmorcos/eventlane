import { Injectable, signal, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { TranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";

import { environment } from "../../environments/environment";
import { UserPreferences } from "../models/user-preferences.model";

import { AuthService } from "./auth.service";

const STORAGE_KEY = "eventlaneLanguage";

@Injectable({ providedIn: "root" })
export class UserPreferencesService {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);
  private initialized = false;

  readonly language = signal<string>("de");
  readonly userPreferencesLoading = signal(true);

  constructor() {
    this.init();
  }

  private async init() {
    console.log("Initializing user preferences service");
    if (this.initialized) return;
    this.initialized = true;

    if (isPlatformBrowser(this.platformId)) {
      await this.authService.waitForAuthentication();

      const preferences = await firstValueFrom(
        this.loadPreferencesFromBackend()
      );
      if (preferences?.language) {
        const userLang = preferences.language;
        this.language.set(userLang);
        this.translate.use(userLang);
        this.storeLanguage(userLang);
      }
    } else {
      const savedLanguage = this.getStoredLanguage();
      const browserLanguage = this.getBrowserLanguage();
      const initialLanguage = savedLanguage || browserLanguage || "de";

      this.language.set(initialLanguage);
      this.translate.use(initialLanguage);
    }

    this.userPreferencesLoading.set(false);
  }

  private getStoredLanguage(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    return localStorage.getItem(STORAGE_KEY);
  }

  private getBrowserLanguage(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("en")) return "en";
    if (browserLang.startsWith("de")) return "de";
    return null;
  }

  private storeLanguage(lang: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.error("Failed to store language preference:", error);
    }
  }

  setLanguage(language: "en" | "de") {
    this.language.set(language);
    this.translate.use(language);
    this.storeLanguage(language);

    firstValueFrom(this.updateBackendPreferences(language));
  }

  private loadPreferencesFromBackend() {
    return this.http.get<UserPreferences>(
      `${environment.apiBaseUrl}/user/preferences`
    );
  }

  private updateBackendPreferences(language: string) {
    return this.http.patch<UserPreferences>(
      `${environment.apiBaseUrl}/user/preferences`,
      { language }
    );
  }
}
