import { Component, OnInit, OnDestroy, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../services/auth.service";
import { ApiService } from "../../services/api.service";
import { EventStateService } from "../../services/event-state.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-event-detail",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./event-detail.component.html",
  styleUrls: ["./event-detail.component.scss"],
})
export class EventDetailComponent implements OnInit, OnDestroy {
  event = this.eventStateService.currentEvent;
  isAuthenticated = this.authService.isAuthenticated;

  userName = "";
  submitting = false;
  message = "";
  isError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private apiService: ApiService,
    private eventStateService: EventStateService
  ) {}

  async ngOnInit() {
    const slug = this.route.snapshot.params["slug"];
    await this.eventStateService.loadEvent(slug);

    const evt = this.event();
    if (evt?.currentUserAttendee) {
      this.userName = evt.currentUserAttendee.name;
    }
  }

  ngOnDestroy() {
    this.eventStateService.leaveEventRoom();
  }

  async rsvp() {
    const evt = this.event();
    if (!evt || !this.userName) return;

    this.submitting = true;
    this.message = "";

    try {
      const result = await firstValueFrom(
        this.apiService.rsvp(evt.slug, { name: this.userName })
      );

      this.showMessage(`RSVP successful! Status: ${result!.status}`, false);
    } catch (error: any) {
      console.error("RSVP error:", error);
      this.showMessage(error.error?.message || "Failed to RSVP", true);
    } finally {
      this.submitting = false;
    }
  }

  async cancel() {
    const evt = this.event();
    if (!evt) return;

    if (!confirm("Are you sure you want to cancel your RSVP?")) return;

    this.submitting = true;
    this.message = "";

    try {
      await firstValueFrom(this.apiService.cancel(evt.slug));
      // WebSocket will automatically update the event
      this.userName = "";
      this.showMessage("RSVP cancelled successfully", false);
    } catch (error: any) {
      console.error("Cancel error:", error);
      this.showMessage(error.error?.message || "Failed to cancel RSVP", true);
    } finally {
      this.submitting = false;
    }
  }

  showMessage(msg: string, error: boolean) {
    this.message = msg;
    this.isError = error;
    setTimeout(() => {
      this.message = "";
    }, 5000);
  }
}
