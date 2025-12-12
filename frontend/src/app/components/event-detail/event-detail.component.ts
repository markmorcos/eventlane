import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  effect,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { FormsModule } from "@angular/forms";

import { AuthService } from "../../services/auth.service";
import { EventDetailStore } from "../../stores/event-detail.store";
import { SeoService } from "../../services/seo.service";
import { ToastService } from "../../services/toast.service";
import { EventDetail } from "../../models/event.model";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";
import { HlmInputDirective } from "../../ui/ui-input-helm/src";
import { HlmBadgeDirective } from "../../ui/ui-badge-helm/src";
import {
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmCardContentDirective,
} from "../../ui/ui-card-helm/src";
import { HlmSkeletonComponent } from "../../ui/ui-skeleton-helm/src";
import { HlmAlertDialogComponent } from "../../ui/ui-alertdialog-helm/src";
import {
  formatEventDate,
  formatEventTime,
  getRelativeTime,
} from "../../utils/date-format";

@Component({
  selector: "app-event-detail",
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    HlmButtonDirective,
    HlmInputDirective,
    HlmBadgeDirective,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardContentDirective,
    HlmSkeletonComponent,
    HlmAlertDialogComponent,
  ],
  templateUrl: "./event-detail.component.html",
})
export class EventDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private store = inject(EventDetailStore);
  private seoService = inject(SeoService);
  private toastService = inject(ToastService);

  event = this.store.event;
  loading = this.store.loading;

  isAuthenticated = this.authService.isAuthenticated;
  email = this.authService.userEmail;
  displayName = this.authService.userDisplayName;

  userName = signal("");
  showCancelDialog = signal(false);

  constructor() {
    effect(() => {
      const evt = this.event();
      if (evt) {
        this.updateSeo(evt);
      }
    });

    effect(() => {
      if (this.displayName()) {
        this.userName.set(this.displayName());
        this.store.reload();
      }
    });
  }

  async ngOnInit() {
    const slug = this.route.snapshot.params["slug"];
    await this.store.init(slug);
  }

  ngOnDestroy() {
    this.store.destroy();
    this.seoService.removeStructuredData();
  }

  private updateSeo(event: EventDetail) {
    const spotsLeft = event.capacity - event.confirmedCount;
    const isFull = spotsLeft <= 0;
    const availabilityText = isFull
      ? `Full - Join waitlist (${event.waitlistedCount} waiting)`
      : `${spotsLeft} of ${event.capacity} spots available`;

    // Update meta tags
    this.seoService.updateTags({
      title: `${event.title} - RSVP on EventLane`,
      description: `RSVP to ${event.title}. ${availabilityText}. Fast and simple event registration with real-time updates.`,
      keywords: `${event.title}, RSVP, event registration, event signup`,
      url: `/events/${event.slug}`,
      type: "website",
    });

    // Add Event structured data
    const eventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      name: event.title,
      url: `https://eventlane.io/events/${event.slug}`,
      description: `RSVP to ${event.title}. ${availabilityText}.`,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      organizer: {
        "@type": "Organization",
        name: "EventLane",
        url: "https://eventlane.io",
      },
      offers: {
        "@type": "Offer",
        availability: isFull
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
        price: "0",
        priceCurrency: "USD",
        url: `https://eventlane.io/events/${event.slug}`,
        validFrom: event.createdAt,
      },
      maximumAttendeeCapacity: event.capacity,
      remainingAttendeeCapacity: Math.max(0, spotsLeft),
    };

    this.seoService.addStructuredData(eventSchema);
  }

  async attend() {
    const evt = this.event();
    if (!evt || !this.userName) return;

    await this.store.attend(evt.slug, this.userName());
  }

  async cancel() {
    this.showCancelDialog.set(true);
  }

  async confirmCancel() {
    const evt = this.event();
    if (!evt) return;

    this.showCancelDialog.set(false);
    await this.store.cancel(evt.slug, this.email()!);
    this.userName.set(this.displayName());
  }

  shareEvent() {
    const evt = this.event();
    if (!evt) return;

    const url = `${window.location.origin}/events/${evt.slug}`;
    navigator.clipboard.writeText(url).then(
      () => {
        this.toastService.success("Link copied to clipboard!");
      },
      () => {
        this.toastService.error("Failed to copy link");
      }
    );
  }

  // Date/time formatting utilities
  formatEventDate = formatEventDate;
  formatEventTime = formatEventTime;
  getRelativeTime = getRelativeTime;

  // URL encoding for template
  encodeURIComponent = encodeURIComponent;
}
