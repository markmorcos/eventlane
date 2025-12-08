import { inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { Router, CanActivateFn } from "@angular/router";
import { firstValueFrom } from "rxjs";

import { EventApiService } from "../services/event-api.service";

export const adminGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const api = inject(EventApiService);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const slug = route.paramMap.get("slug");

  if (!slug) {
    router.navigate(["/events"]);
    return false;
  }

  try {
    const event = await firstValueFrom(api.getEvent(slug));

    if (!event.isAdmin) {
      router.navigate(["/events", slug]);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Admin guard error:", err);
    router.navigate(["/events"]);
    return false;
  }
};
