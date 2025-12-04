import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { EventListStore } from "../../services/event-list.store";
import { SeoService } from "../../services/seo.service";

@Component({
  selector: "app-events-list",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./events-list.component.html",
  styleUrls: ["./events-list.component.scss"],
})
export class EventsListComponent implements OnInit {
  private eventListStore = inject(EventListStore);
  private authService = inject(AuthService);
  private seoService = inject(SeoService);

  isAuthenticated = this.authService.isAuthenticated;
  events = this.eventListStore.events;
  loading = this.eventListStore.loading;
  error = this.eventListStore.error;

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
    this.eventListStore.loadAllEvents();
  }
}
