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
  {
    path: "privacy-policy",
    loadComponent: () =>
      import("./components/legal/privacy-policy/privacy-policy.component").then(
        (m) => m.PrivacyPolicyComponent
      ),
  },
  {
    path: "terms-of-service",
    loadComponent: () =>
      import(
        "./components/legal/terms-of-service/terms-of-service.component"
      ).then((m) => m.TermsOfServiceComponent),
  },
  {
    path: "cookie-policy",
    loadComponent: () =>
      import("./components/legal/cookie-policy/cookie-policy.component").then(
        (m) => m.CookiePolicyComponent
      ),
  },
  {
    path: "gdpr",
    loadComponent: () =>
      import("./components/legal/gdpr/gdpr.component").then(
        (m) => m.GdprComponent
      ),
  },
  { path: "**", redirectTo: "/" },
];
