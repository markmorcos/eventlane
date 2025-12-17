import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from "@angular/core";

import { environment } from "../../../environments/environment";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { AuthService } from "@eventlane/shared";
import { EventListStore } from "@eventlane/shared";
import { SeoService } from "@eventlane/shared";
import { UserPreferencesService } from "@eventlane/shared";
import { HlmButtonDirective } from "@eventlane/shared";
import { HlmBadgeDirective } from "@eventlane/shared";
import { HlmSkeletonCardComponent } from "@eventlane/shared";
import { formatEventDateTime } from "@eventlane/shared";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  getAdminUrl() {
    return `${environment.adminUrl}/events/create`;
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
    this.store.loadAttendingEvents();
  }

  ngOnDestroy() {
    this.store.destroy();
  }
}
