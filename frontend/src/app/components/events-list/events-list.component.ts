import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { EventStateService } from "../../services/event-state.service";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-events-list",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./events-list.component.html",
  styleUrls: ["./events-list.component.scss"],
})
export class EventsListComponent implements OnInit {
  events = this.eventStateService.events;
  loading = this.eventStateService.loading;

  constructor(
    public eventStateService: EventStateService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    // Events are auto-loaded in the service
  }
}
