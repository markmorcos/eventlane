import {
  Injectable,
  signal,
  PLATFORM_ID,
  inject,
  TransferState,
  makeStateKey,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { TranslateService } from "@ngx-translate/core";

import { INITIAL_LOCALE } from "../providers/locale.provider";

const STORAGE_KEY = "eventlaneLanguage";
const LANGUAGE_STATE_KEY = makeStateKey<string>("user-language");

@Injectable({ providedIn: "root" })
export class UserPreferencesService {
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);
  private initialLocale = inject(INITIAL_LOCALE);
  private initialized = false;

  readonly language = signal<string>("de");
  readonly userPreferencesLoading = signal(true);

  constructor() {
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    this.initialized = true;

    const transferredLanguage = this.transferState.get(
      LANGUAGE_STATE_KEY,
      null
    );

    if (isPlatformBrowser(this.platformId)) {
      const savedLanguage = this.getStoredLanguage();
      const browserLanguage = this.getBrowserLanguage();
      const initialLanguage =
        savedLanguage || browserLanguage || transferredLanguage || "de";

      this.language.set(initialLanguage);
      this.translate.use(initialLanguage);
    } else {
      const serverLanguage = this.initialLocale || "de";

      this.language.set(serverLanguage);
      this.translate.use(serverLanguage);

      this.transferState.set(LANGUAGE_STATE_KEY, serverLanguage);
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
  }
}
