import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { EventStateService } from "../../services/event-state.service";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-create-event",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./create-event.component.html",
  styleUrls: ["./create-event.component.scss"],
})
export class CreateEventComponent {
  isAuthenticated = this.authService.isAuthenticated;
  loading = this.eventStateService.loading;
  error = this.eventStateService.error;

  title = "";
  slug = "";
  capacity = 10;
  adminEmails = "";
  submitting = false;
  message = "";
  isError = false;

  constructor(
    private eventStateService: EventStateService,
    private authService: AuthService,
    private router: Router
  ) {}

  generateSlug() {
    if (this.title) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
  }

  async createEvent() {
    if (!this.title || !this.slug || this.capacity < 1) {
      this.showMessage("Please fill in all required fields", true);
      return;
    }

    this.submitting = true;
    this.message = "";

    try {
      const adminEmailsList = this.adminEmails
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e);

      const event = await this.eventStateService.createEvent({
        title: this.title,
        slug: this.slug,
        capacity: this.capacity,
        adminEmails: adminEmailsList.length > 0 ? adminEmailsList : undefined,
      });

      this.showMessage("Event created successfully!", false);

      // Navigate to the new event after a short delay
      setTimeout(() => {
        this.router.navigate(["/events", event.slug]);
      }, 1500);
    } catch (error: any) {
      console.error("Create event error:", error);
      this.showMessage(error.error?.message || "Failed to create event", true);
    } finally {
      this.submitting = false;
    }
  }

  showMessage(msg: string, error: boolean) {
    this.message = msg;
    this.isError = error;
    setTimeout(() => {
      if (!error) {
        this.message = "";
      }
    }, 5000);
  }
}
