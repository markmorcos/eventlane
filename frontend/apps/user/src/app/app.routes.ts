import { Routes } from "@angular/router";
import { legalRoutes } from "@eventlane/shared";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./components/landing/landing.component").then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: "events/:slug",
    loadComponent: () =>
      import("./components/event-detail/event-detail.component").then(
        (m) => m.EventDetailComponent
      ),
  },
  {
    path: "events",
    loadComponent: () =>
      import("./components/events-list/events-list.component").then(
        (m) => m.EventsListComponent
      ),
  },
  // Legal pages - lazy loaded as a group
  {
    path: "",
    loadChildren: () => legalRoutes,
  },
  { path: "**", redirectTo: "/" },
];
