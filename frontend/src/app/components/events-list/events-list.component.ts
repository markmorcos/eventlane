import { Component, inject, OnInit, OnDestroy } from "@angular/core";

import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "../../services/auth.service";
import { EventListStore } from "../../stores/event-list.store";
import { SeoService } from "../../services/seo.service";
import { UserPreferencesService } from "../../services/user-preferences.service";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";
import { HlmBadgeDirective } from "../../ui/ui-badge-helm/src";
import { HlmSkeletonCardComponent } from "../../ui/ui-skeleton-helm/src";
import { formatEventDateTime } from "../../utils/date-format";

@Component({
  selector: "app-events-list",
  imports: [
    RouterLink,
    TranslateModule,
    HlmButtonDirective,
    HlmBadgeDirective,
    HlmSkeletonCardComponent,
  ],
  templateUrl: "./events-list.component.html",
})
export class EventsListComponent implements OnInit, OnDestroy {
  private store = inject(EventListStore);
  private authService = inject(AuthService);
  private seoService = inject(SeoService);
  private preferencesService = inject(UserPreferencesService);

  isAuthenticated = this.authService.isAuthenticated;
  events = this.store.events;
  loading = this.store.loading;
  error = this.store.error;
  language = this.preferencesService.language;

  formatEventDateTime(timestamp: number, timezone: string) {
    return formatEventDateTime(timestamp, timezone, this.language());
  }

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

  ngOnDestroy() {
    this.store.destroy();
  }
}
