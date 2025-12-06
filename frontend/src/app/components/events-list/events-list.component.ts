import { Component, inject, OnInit } from "@angular/core";

import { RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { EventListStore } from "../../stores/event-list.store";
import { SeoService } from "../../services/seo.service";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";
import { HlmBadgeDirective } from "../../ui/ui-badge-helm/src";
import { HlmSkeletonCardComponent } from "../../ui/ui-skeleton-helm/src";

@Component({
  selector: "app-events-list",
  imports: [
    RouterLink,
    HlmButtonDirective,
    HlmBadgeDirective,
    HlmSkeletonCardComponent,
  ],
  templateUrl: "./events-list.component.html",
})
export class EventsListComponent implements OnInit {
  private store = inject(EventListStore);
  private authService = inject(AuthService);
  private seoService = inject(SeoService);

  isAuthenticated = this.authService.isAuthenticated;
  events = this.store.events;
  loading = this.store.loading;
  error = this.store.error;

  ngOnInit() {
    this.seoService.updateTags({
      title: "Browse Events - EventLane",
      description:
        "Discover and RSVP to events on EventLane. Browse upcoming events and manage your RSVPs in one place.",
      keywords: "events, RSVP, event list, browse events",
      url: "/events",
      type: "website",
    });
    this.seoService.removeStructuredData();
    this.store.loadManagedEvents();
  }
}
