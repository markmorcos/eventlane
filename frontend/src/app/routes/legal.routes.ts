import { Routes } from "@angular/router";

export const legalRoutes: Routes = [
  {
    path: "privacy-policy",
    loadComponent: () =>
      import("../components/legal/privacy-policy/privacy-policy.component").then(
        (m) => m.PrivacyPolicyComponent
      ),
  },
  {
    path: "terms-of-service",
    loadComponent: () =>
      import(
        "../components/legal/terms-of-service/terms-of-service.component"
      ).then((m) => m.TermsOfServiceComponent),
  },
  {
    path: "cookie-policy",
    loadComponent: () =>
      import("../components/legal/cookie-policy/cookie-policy.component").then(
        (m) => m.CookiePolicyComponent
      ),
  },
  {
    path: "gdpr",
    loadComponent: () =>
      import("../components/legal/gdpr/gdpr.component").then(
        (m) => m.GdprComponent
      ),
  },
];
