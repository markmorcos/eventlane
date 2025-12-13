import {
  Injectable,
  signal,
  PLATFORM_ID,
  inject,
  computed,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { TranslateService } from "@ngx-translate/core";
import { catchError, of, tap } from "rxjs";

import { environment } from "../../environments/environment";
import {
  UserPreferences,
  UpdateUserPreferencesRequest,
} from "../models/user-preferences.model";
import { AuthService } from "./auth.service";

const STORAGE_KEY = "eventlane_language";

@Injectable({ providedIn: "root" })
export class UserPreferencesService {
  private http = inject(HttpClient);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private initialized = false;

  readonly language = signal<"en" | "de">("de");
  readonly userPreferencesLoading = signal(true);

  constructor() {
    this.initializeLanguage();
  }

  private async initializeLanguage() {
    if (this.initialized) return;
    this.initialized = true;

    // Priority: localStorage → browser language → default DE
    const savedLanguage = this.getStoredLanguage();
    const browserLanguage = this.getBrowserLanguage();
    const initialLanguage = savedLanguage || browserLanguage || "de";

    this.language.set(initialLanguage as "en" | "de");
    this.translate.use(initialLanguage);

    // Load from backend after auth
    (await this.authService.isAuthenticated())
      ? this.loadPreferencesFromBackend()
      : null;

    this.userPreferencesLoading.set(false);
  }

  private getStoredLanguage(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private getBrowserLanguage(): string {
    if (!isPlatformBrowser(this.platformId)) {
      // On server: could parse Accept-Language header if available
      // For now, return default
      return "de";
    }

    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("en")) return "en";
    if (browserLang.startsWith("de")) return "de";
    return "de";
  }

  private storeLanguage(lang: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.error("Failed to store language preference:", error);
    }
  }

  setLanguage(lang: "en" | "de") {
    this.language.set(lang);
    this.translate.use(lang);
    this.storeLanguage(lang);

    // Sync to backend if authenticated
    if (this.authService.isAuthenticated()) {
      this.updateBackendPreferences(lang);
    }
  }

  private loadPreferencesFromBackend() {
    this.http
      .get<UserPreferences>(`${environment.apiBaseUrl}/user/preferences`)
      .pipe(
        tap((prefs) => {
          const lang = prefs.language as "en" | "de";
          this.language.set(lang);
          this.translate.use(lang);
          this.storeLanguage(lang);
        }),
        catchError((error) => {
          console.error("Failed to load user preferences:", error);
          return of(null);
        })
      )
      .subscribe();
  }

  private updateBackendPreferences(lang: string) {
    const request: UpdateUserPreferencesRequest = { language: lang };

    this.http
      .patch<UserPreferences>(
        `${environment.apiBaseUrl}/user/preferences`,
        request
      )
      .pipe(
        catchError((error) => {
          console.error("Failed to update user preferences:", error);
          return of(null);
        })
      )
      .subscribe();
  }
}
