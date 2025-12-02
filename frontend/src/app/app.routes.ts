import { Routes } from "@angular/router";
import { LandingComponent } from "./components/landing/landing.component";

export const routes: Routes = [
  { path: "", component: LandingComponent },
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
    loadComponent: () =>
      import("./components/admin-event/admin-event.component").then(
        (m) => m.AdminEventComponent
      ),
  },
  { path: "**", redirectTo: "/" },
];
