import { Component, OnInit, OnDestroy, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";

import { AuthService } from "../../services/auth.service";
import { ApiService } from "../../services/api.service";
import { EventDetailStore } from "../../services/event-detail.store";

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

  event = this.eventDetailStore.event;
  loading = this.eventDetailStore.loading;

  isAuthenticated = this.authService.isAuthenticated;

  userName = signal("");

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
