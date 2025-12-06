import { RenderMode, ServerRoute } from "@angular/ssr";

export const serverRoutes: ServerRoute[] = [
  { path: "", renderMode: RenderMode.Prerender },
  { path: "events", renderMode: RenderMode.Prerender },
  { path: "events/create", renderMode: RenderMode.Prerender },
  { path: "events/:slug", renderMode: RenderMode.Server },
  { path: "admin/events/:slug", renderMode: RenderMode.Server },
  { path: "privacy-policy", renderMode: RenderMode.Prerender },
  { path: "terms-of-service", renderMode: RenderMode.Prerender },
  { path: "cookie-policy", renderMode: RenderMode.Prerender },
  { path: "gdpr", renderMode: RenderMode.Prerender },
  { path: "**", renderMode: RenderMode.Prerender },
];
