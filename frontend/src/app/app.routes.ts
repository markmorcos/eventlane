import { Routes } from "@angular/router";
import { adminGuard } from "./guards/admin.guard";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./components/landing/landing.component").then(
        (m) => m.LandingComponent
      ),
  },
  {
    path: "events",
    loadComponent: () =>
      import("./components/events-list/events-list.component").then(
        (m) => m.EventsListComponent
      ),
  },
  {
    path: "events/create",
    loadComponent: () =>
      import("./components/create-event/create-event.component").then(
        (m) => m.CreateEventComponent
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
    path: "admin/events/:slug",
    canActivate: [adminGuard],
    loadComponent: () =>
      import("./components/admin-event/admin-event.component").then(
        (m) => m.AdminEventComponent
      ),
  },
  // Legal pages - lazy loaded as a group
  {
    path: "",
    loadChildren: () =>
      import("./routes/legal.routes").then((m) => m.legalRoutes),
  },
  { path: "**", redirectTo: "/" },
];
