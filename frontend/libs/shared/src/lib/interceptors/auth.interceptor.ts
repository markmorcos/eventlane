import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { from, switchMap } from "rxjs";
import { AuthService } from "../services/auth.service";
import { ENVIRONMENT } from "../environment.token";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const environment = inject(ENVIRONMENT);

  if (!req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  return from(authService.getIdToken()).pipe(
    switchMap((token) => {
      if (token) {
        const cloned = req.clone({
          headers: req.headers.set("Authorization", `Bearer ${token}`),
        });
        return next(cloned);
      }
      return next(req);
    })
  );
};
