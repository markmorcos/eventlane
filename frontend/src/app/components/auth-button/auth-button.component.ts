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

  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
    } catch (error) {
      console.error("Error signing in with Google:", error);
      alert("Failed to sign in. Please try again.");
    }
  }

  async signOut() {
    await this.authService.signOut();
  }
}
