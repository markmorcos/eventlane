import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";

import { AuthService } from "../../services/auth.service";
import { EventListStore } from "../../services/event-list.store";
import { SeoService } from "../../services/seo.service";

@Component({
  selector: "app-create-event",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./create-event.component.html",
  styleUrls: ["./create-event.component.scss"],
})
export class CreateEventComponent implements OnInit {
  private eventListStore = inject(EventListStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  private seoService = inject(SeoService);

  isAuthenticated = this.authService.isAuthenticated;
  loading = this.eventListStore.loading;
  error = this.eventListStore.error;

  title = "";
  slug = "";
  capacity = 8;
  adminEmails = "";
  message = "";

  ngOnInit() {
    this.seoService.updateTags({
      title: "Create New Event - EventLane",
      description:
        "Create your event in seconds. Set capacity, share your unique link, and manage RSVPs automatically.",
      keywords: "create event, event management, RSVP",
      url: "/create",
      type: "website",
    });
    this.seoService.removeStructuredData();
  }

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
