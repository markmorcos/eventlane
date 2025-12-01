import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-auth-callback",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./auth-callback.component.html",
  styleUrls: ["./auth-callback.component.scss"],
})
export class AuthCallbackComponent implements OnInit {
  error = "";

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    try {
      await this.authService.completeSignInWithEmailLink(window.location.href);
      this.router.navigate(["/events"]);
    } catch (error: any) {
      this.error = error.message || "Failed to complete sign-in";
      console.error("Auth callback error:", error);
    }
  }
}
