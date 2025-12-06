import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";

import { AuthService } from "../../services/auth.service";
import { SeoService } from "../../services/seo.service";
import { EventListStore } from "../../stores/event-list.store";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";
import { HlmInputDirective } from "../../ui/ui-input-helm/src";
import { HlmLabelDirective } from "../../ui/ui-label-helm/src";
import { HlmCardDirective, HlmCardHeaderDirective, HlmCardTitleDirective, HlmCardContentDirective } from "../../ui/ui-card-helm/src";

@Component({
  selector: "app-create-event",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HlmButtonDirective, HlmInputDirective, HlmLabelDirective, HlmCardDirective, HlmCardHeaderDirective, HlmCardTitleDirective, HlmCardContentDirective],
  templateUrl: "./create-event.component.html",
})
export class CreateEventComponent implements OnInit {
  private store = inject(EventListStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  private seoService = inject(SeoService);

  isAuthenticated = this.authService.isAuthenticated;
  loading = this.store.loading;
  error = this.store.error;

  title = "";
  slug = "";
  capacity = 8;

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

    const event = await this.store.createEvent({
      title: this.title,
      slug: this.slug,
      capacity: this.capacity,
    });

    if (event) {
      this.router.navigate(["/events", event.slug]);
    }
  }
}
