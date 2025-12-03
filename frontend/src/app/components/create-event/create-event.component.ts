import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";

import { AuthService } from "../../services/auth.service";
import { EventListStore } from "../../services/event-list.store";

@Component({
  selector: "app-create-event",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./create-event.component.html",
  styleUrls: ["./create-event.component.scss"],
})
export class CreateEventComponent {
  isAuthenticated = this.authService.isAuthenticated;

  title = "";
  slug = "";
  capacity = 8;
  adminEmails = "";
  submitting = false;
  message = "";
  isError = false;

  constructor(
    private eventListStore: EventListStore,
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
    if (!this.title || !this.slug || this.capacity < 1) return;

    this.submitting = true;
    this.message = "";

    const adminEmailsList = this.adminEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    const event = await this.eventListStore.createEvent({
      title: this.title,
      slug: this.slug,
      capacity: this.capacity,
      adminEmails: adminEmailsList.length > 0 ? adminEmailsList : undefined,
    });

    if (event) {
      this.router.navigate(["/events", event.slug]);
    }
  }
}
