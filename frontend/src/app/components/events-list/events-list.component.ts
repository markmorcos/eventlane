import { Component, inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../services/auth.service";
import { EventListStore } from "../../services/event-list.store";

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

  isAuthenticated = this.authService.isAuthenticated;
  events = this.eventListStore.events;
  loading = this.eventListStore.loading;
  error = this.eventListStore.error;

  ngOnInit() {
    this.eventListStore.loadAllEvents();
  }
}
