import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-auth-button",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./auth-button.component.html",
  styleUrls: ["./auth-button.component.scss"],
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
