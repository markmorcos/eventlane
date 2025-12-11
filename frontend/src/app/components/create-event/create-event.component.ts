import { Component, inject, OnInit } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";

import { AuthService } from "../../services/auth.service";
import { SeoService } from "../../services/seo.service";
import { ToastService } from "../../services/toast.service";
import { EventListStore } from "../../stores/event-list.store";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";
import { HlmInputDirective } from "../../ui/ui-input-helm/src";
import { HlmLabelDirective } from "../../ui/ui-label-helm/src";
import {
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmCardContentDirective,
} from "../../ui/ui-card-helm/src";
import { TimezoneSelectorComponent } from "../timezone-selector/timezone-selector.component";

@Component({
  selector: "app-create-event",
  imports: [
    FormsModule,
    RouterLink,
    HlmButtonDirective,
    HlmInputDirective,
    HlmLabelDirective,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardContentDirective,
    TimezoneSelectorComponent,
  ],
  templateUrl: "./create-event.component.html",
})
export class CreateEventComponent implements OnInit {
  private store = inject(EventListStore);
  private authService = inject(AuthService);
  private router = inject(Router);
  private seoService = inject(SeoService);
  private toastService = inject(ToastService);

  isAuthenticated = this.authService.isAuthenticated;
  loading = this.store.loading;
  error = this.store.error;

  title = "";
  capacity = 8;
  eventDate = "";
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  getDefaultDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  }

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

    this.eventDate = this.getDefaultDate();
  }

  isFormValid(): boolean {
    return (
      this.title.trim().length > 0 &&
      this.capacity >= 1 &&
      this.eventDate.length > 0 &&
      this.timezone.length > 0 &&
      !this.loading()
    );
  }

  async createEvent() {
    if (!this.isFormValid()) {
      this.toastService.error(
        "Invalid form",
        "Please check all fields and try again."
      );
      return;
    }

    const event = await this.store.createEvent({
      title: this.title,
      capacity: this.capacity,
      eventDate: new Date(this.eventDate).toISOString(),
      timezone: this.timezone,
    });

    if (event) {
      this.toastService.success(
        "Event created!",
        `${event.title} is ready to accept RSVPs.`
      );
      this.router.navigate(["/events", event.slug]);
    } else {
      this.toastService.error(
        "Failed to create event",
        this.store.error() || "Please try again."
      );
    }
  }
}
