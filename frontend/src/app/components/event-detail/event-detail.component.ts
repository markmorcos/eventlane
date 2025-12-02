import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  effect,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute } from "@angular/router";
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

  currentUserName = computed(
    () => this.authService.currentUser()?.displayName || ""
  );
  userName = signal(this.currentUserName());
  submitting = false;
  message = "";
  isError = false;

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private apiService: ApiService,
    private eventStateService: EventStateService
  ) {
    effect(
      () =>
        this.userName.set(this.authService.currentUser()?.displayName ?? ""),
      { allowSignalWrites: true }
    );
  }

  async ngOnInit() {
    const slug = this.route.snapshot.params["slug"];
    await this.eventStateService.loadEvent(slug);

    const evt = this.event();
    if (evt?.currentUserAttendee) {
      this.userName.set(evt.currentUserAttendee.name);
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
        this.apiService.rsvp(evt.slug, { name: this.userName() })
      );
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
      this.userName.set(this.currentUserName());
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
