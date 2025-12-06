import { inject } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { EventDetailStore } from "../stores/event-detail.store";

export const adminGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const store = inject(EventDetailStore);

  const slug = route.paramMap.get("slug");

  if (!slug) {
    router.navigate(["/events"]);
    return false;
  }

  // Initialize the store if needed
  await store.init(slug);

  const event = store.event();

  if (!event?.isAdmin) {
    router.navigate(["/events", slug]);
    return false;
  }

  return true;
};
