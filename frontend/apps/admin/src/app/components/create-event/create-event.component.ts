import {
  Component,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { firstValueFrom } from "rxjs";

import { environment } from "../../../environments/environment";
import { AuthService } from "@eventlane/shared";
import { EventApiService } from "@eventlane/shared";
import { SeoService } from "@eventlane/shared";
import { ToastService } from "@eventlane/shared";
import { convertLocalDateTimeToUTC } from "@eventlane/shared";
import { HlmButtonDirective } from "@eventlane/shared";
import { HlmInputDirective } from "@eventlane/shared";
import { HlmLabelDirective } from "@eventlane/shared";
import {
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmCardContentDirective,
} from "@eventlane/shared";
import { TimezoneSelectorComponent } from "@eventlane/shared";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateEventComponent implements OnInit {
  private authService = inject(AuthService);
  private eventApiService = inject(EventApiService);
  private router = inject(Router);
  private seoService = inject(SeoService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  isAuthenticated = this.authService.isAuthenticated;
  loading = signal(false);
  createdEvent = signal<{
    slug: string;
    title: string;
    seriesSlug: string;
  } | null>(null);

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
        this.translate.instant("createEvent.invalidForm"),
        this.translate.instant("createEvent.invalidFormDesc")
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

      this.createdEvent.set({
        slug: result.slug,
        title: result.title,
        seriesSlug: result.seriesSlug,
      });

      this.toastService.success(
        this.translate.instant("createEvent.eventCreated"),
        this.translate.instant("createEvent.eventCreatedDesc", {
          title: result.title,
        })
      );
    } catch (error: any) {
      this.toastService.error(
        this.translate.instant("createEvent.createFailed"),
        error?.error?.message ||
          this.translate.instant("createEvent.createFailedDesc")
      );
      console.error(error);
    } finally {
      this.loading.set(false);
    }
  }

  getEventLink() {
    const evt = this.createdEvent();
    if (!evt) return "";
    return `${environment.userUrl}/events/${evt.slug}`;
  }

  shareEvent() {
    const evt = this.createdEvent();
    if (!evt) return;

    const url = this.getEventLink();
    navigator.clipboard.writeText(url).then(
      () => {
        this.toastService.success(
          this.translate.instant("createEvent.linkCopied")
        );
      },
      () => {
        this.toastService.error(
          this.translate.instant("createEvent.copyFailed")
        );
      }
    );
  }

  goToAdminView() {
    const evt = this.createdEvent();
    if (!evt) return;
    this.router.navigate(["/events", evt.seriesSlug]);
  }

  createAnother() {
    this.createdEvent.set(null);
    this.title = "";
    this.capacity = 8;
    this.eventDate = this.getDefaultDate();
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.isRecurring.set(false);
    this.intervalType = "weekly";
    this.leadWeeks = 4;
    this.hasEndDate.set(false);
    this.endDate = "";
  }
}
