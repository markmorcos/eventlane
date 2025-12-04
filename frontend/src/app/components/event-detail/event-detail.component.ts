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
import { firstValueFrom } from "rxjs";

import { AuthService } from "../../services/auth.service";
import { ApiService } from "../../services/api.service";
import { EventDetailStore } from "../../services/event-detail.store";
import { SeoService } from "../../services/seo.service";
import { EventDetail } from "../../models/event.models";

@Component({
  selector: "app-event-detail",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./event-detail.component.html",
  styleUrls: ["./event-detail.component.scss"],
})
export class EventDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private eventDetailStore = inject(EventDetailStore);
  private seoService = inject(SeoService);

  event = this.eventDetailStore.event;
  loading = this.eventDetailStore.loading;

  isAuthenticated = this.authService.isAuthenticated;

  userName = signal("");

  constructor() {
    // Update SEO when event data changes
    effect(() => {
      const evt = this.event();
      if (evt) {
        this.updateSeo(evt);
      }
    });
  }

  async getDefaultName() {
    const displayName = await this.authService.getDisplayName();
    return this.event()?.currentUserAttendee?.name || displayName || "";
  }

  async ngOnInit() {
    const slug = this.route.snapshot.params["slug"];
    await this.eventDetailStore.loadEvent(slug);

    this.userName.set(await this.getDefaultName());
  }

  ngOnDestroy() {
    this.eventDetailStore.leaveEventRoom();
    this.seoService.removeStructuredData();
  }

  private updateSeo(event: EventDetail) {
    const spotsLeft = event.capacity - event.confirmedCount;
    const isFull = spotsLeft <= 0;
    const availabilityText = isFull
      ? `Full - Join waitlist (${event.waitlistCount} waiting)`
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

  async rsvp() {
    const evt = this.event();
    if (!evt || !this.userName) return;

    await firstValueFrom(
      this.apiService.rsvp(evt.slug, { name: this.userName() })
    );
  }

  async cancel() {
    const evt = this.event();
    if (!evt) return;

    if (!confirm("Are you sure you want to cancel your RSVP?")) return;

    await firstValueFrom(this.apiService.cancel(evt.slug));
    this.userName.set(await this.getDefaultName());
  }
}
