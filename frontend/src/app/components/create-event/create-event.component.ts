import { Component, inject, OnInit, signal } from "@angular/core";

import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";

import { AuthService } from "../../services/auth.service";
import { EventApiService } from "../../services/event-api.service";
import { SeoService } from "../../services/seo.service";
import { ToastService } from "../../services/toast.service";
import { convertLocalDateTimeToUTC } from "../../utils/date-format";
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
    TranslateModule,
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
  private authService = inject(AuthService);
  private eventApiService = inject(EventApiService);
  private router = inject(Router);
  private seoService = inject(SeoService);
  private toastService = inject(ToastService);

  isAuthenticated = this.authService.isAuthenticated;
  loading = signal(false);

  title = "";
  capacity = 8;
  eventDate = "";
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Recurrence options
  isRecurring = signal(false);
  intervalType = "weekly";
  leadWeeks = 4;
  hasEndDate = signal(false);
  endDate = "";

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
    const basicValid =
      this.title.trim().length > 0 &&
      this.capacity >= 1 &&
      this.eventDate.length > 0 &&
      this.timezone.length > 0 &&
      !this.loading();

    if (!basicValid) return false;

    if (this.isRecurring()) {
      if (this.leadWeeks < 1 || this.leadWeeks > 52) return false;
      if (this.hasEndDate() && !this.endDate) return false;
    }

    return true;
  }

  getIntervalDuration(): string | null {
    if (!this.isRecurring()) return null;
    return this.intervalType === "weekly" ? "P7D" : "P14D";
  }

  async createEvent() {
    if (!this.isFormValid()) {
      this.toastService.error(
        "Invalid form",
        "Please check all fields and try again."
      );
      return;
    }

    this.loading.set(true);

    try {
      const eventDateUTC = convertLocalDateTimeToUTC(
        this.eventDate,
        this.timezone
      );

      const payload: any = {
        title: this.title,
        capacity: this.capacity,
        eventDate: eventDateUTC,
        timezone: this.timezone,
        interval: this.getIntervalDuration(),
        leadWeeks: this.isRecurring() ? this.leadWeeks : 1,
        endDate:
          this.hasEndDate() && this.endDate
            ? convertLocalDateTimeToUTC(this.endDate, this.timezone)
            : null,
      };

      const result = await firstValueFrom(
        this.eventApiService.createEvent(payload)
      );

      this.toastService.success(
        "Event created!",
        `${result.seriesTitle || this.title} is ready to accept RSVPs.`
      );
      this.router.navigate(["/admin/events", result.seriesSlug]);
    } catch (error: any) {
      this.toastService.error(
        "Failed to create event",
        error?.error?.message || "Please try again."
      );
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }
}
