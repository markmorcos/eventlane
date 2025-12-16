import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter, withViewTransitions } from "@angular/router";
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
} from "@angular/common/http";
import { provideClientHydration } from "@angular/platform-browser";
import { provideTranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";

import { routes } from "./app.routes";
import {
  authInterceptor,
  provideInitialLocale,
  ENVIRONMENT,
} from "@eventlane/shared";
import { environment } from "../environments/environment";

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ENVIRONMENT, useValue: environment },
    provideZoneChangeDetection(),
    provideRouter(
      routes,
      withViewTransitions({
        onViewTransitionCreated: () => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        },
      })
    ),
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),
    provideClientHydration(),
    provideTranslateService({
      fallbackLang: "de",
    }),
    provideTranslateHttpLoader({
      prefix: "./assets/i18n/",
      suffix: ".json",
    }),
    provideInitialLocale(),
  ],
};
