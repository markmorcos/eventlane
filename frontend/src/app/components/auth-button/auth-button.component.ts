import { Component } from "@angular/core";

import { AuthService } from "../../services/auth.service";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";

@Component({
  selector: "app-auth-button",
  imports: [HlmButtonDirective],
  templateUrl: "./auth-button.component.html",
})
export class AuthButtonComponent {
  currentUser = this.authService.currentUser;
  authLoading = this.authService.authLoading;

  constructor(private authService: AuthService) {}

  signInWithGoogle() {
    return this.authService.signInWithGoogle();
  }

  signOut() {
    return this.authService.signOut();
  }
}
