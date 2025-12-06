import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { provideRouter, withViewTransitions } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { routes } from "./app/app.routes";
import { authInterceptor } from "./app/interceptors/auth.interceptor";

// Polyfill for SockJS
(window as any).global = window;

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withViewTransitions({
        onViewTransitionCreated: () => {
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        },
      })
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
}).catch((err) => console.error(err));
