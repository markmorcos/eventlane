import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-auth-button",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./auth-button.component.html",
  styleUrls: ["./auth-button.component.scss"],
})
export class AuthButtonComponent {
  currentUser = this.authService.currentUser;
  email = "";
  showSignIn = false;
  emailSent = false;

  constructor(private authService: AuthService) {}

  async sendSignInLink() {
    if (!this.email) return;

    try {
      await this.authService.sendSignInLinkToEmail(this.email);
      this.emailSent = true;
      setTimeout(() => {
        this.showSignIn = false;
        this.emailSent = false;
        this.email = "";
      }, 3000);
    } catch (error) {
      console.error("Error sending sign-in link:", error);
      alert("Failed to send sign-in link. Please try again.");
    }
  }

  async signOut() {
    await this.authService.signOut();
  }
}
