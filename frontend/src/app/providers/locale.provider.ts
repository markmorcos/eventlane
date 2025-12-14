import { InjectionToken, PLATFORM_ID, inject, REQUEST } from "@angular/core";
import { isPlatformServer } from "@angular/common";

export const INITIAL_LOCALE = new InjectionToken<string>("INITIAL_LOCALE");

export function provideInitialLocale() {
  return {
    provide: INITIAL_LOCALE,
    useFactory: () => {
      const platformId = inject(PLATFORM_ID);

      if (isPlatformServer(platformId)) {
        try {
          const request = inject(REQUEST) as any;
          const headers = request?.headers;
          const acceptLanguage =
            headers?.get?.("accept-language") || headers?.["accept-language"];

          if (acceptLanguage) {
            const languages = acceptLanguage.split(",").map((lang: string) => {
              const [code] = lang.trim().split(";");
              return code.toLowerCase();
            });

            if (languages.some((lang: string) => lang.startsWith("de"))) {
              return "de";
            }

            if (languages.some((lang: string) => lang.startsWith("en"))) {
              return "en";
            }
          }
        } catch (error) {
          console.warn("Could not access REQUEST token:", error);
        }
      }

      // Default fallback
      return "de";
    },
  };
}
