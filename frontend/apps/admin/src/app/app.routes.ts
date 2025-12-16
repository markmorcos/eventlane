import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "events/create",
    loadComponent: () =>
      import("./components/create-event/create-event.component").then(
        (m) => m.CreateEventComponent
      ),
  },
  {
    path: "events/:seriesSlug/:eventSlug",
    loadComponent: () =>
      import("./components/admin-event/admin-event.component").then(
        (m) => m.AdminEventComponent
      ),
  },
  {
    path: "events/:slug",
    loadComponent: () =>
      import(
        "./components/admin-series-detail/admin-series-detail.component"
      ).then((m) => m.AdminSeriesDetailComponent),
  },
  {
    path: "events",
    loadComponent: () =>
      import("./components/admin-series-list/admin-series-list.component").then(
        (m) => m.AdminSeriesListComponent
      ),
  },
  { path: "", redirectTo: "/events", pathMatch: "full" },
  { path: "**", redirectTo: "/events" },
];
