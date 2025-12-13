import { inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { Router, CanActivateFn } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { EventApiService } from "../services/event-api.service";
import { EventSeriesApiService } from "../services/event-series-api.service";

export const adminGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const eventApi = inject(EventApiService);
  const seriesApi = inject(EventSeriesApiService);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const seriesSlug = route.paramMap.get("seriesSlug");
  const eventSlug = route.paramMap.get("eventSlug");

  if (!seriesSlug) {
    return true;
  }

  try {
    await firstValueFrom(seriesApi.getSeries(seriesSlug));

    return true;
  } catch (err: any) {
    console.error("Admin guard error:", err);

    if (err.status === 403 || err.status === 404) {
      if (eventSlug) {
        router.navigate(["/events", eventSlug]);
      } else {
        router.navigate(["/events"]);
      }
    } else {
      router.navigate(["/events"]);
    }

    return false;
  }
};
