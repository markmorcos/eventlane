import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";

import { AdminsStore } from "../../services/admins.store";
import { AttendeesStore } from "../../services/attendees.store";
import { EventDetailStore } from "../../services/event-detail.store";

@Component({
  selector: "app-admin-event",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./admin-event.component.html",
  styleUrls: ["./admin-event.component.scss"],
})
export class AdminEventComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventDetailStore = inject(EventDetailStore);
  private attendeesStore = inject(AttendeesStore);
  private adminsStore = inject(AdminsStore);

  event = this.eventDetailStore.event;
  attendees = this.attendeesStore.attendees;
  admins = this.adminsStore.admins;
  updating = computed(() =>
    [
      this.eventDetailStore.loading(),
      this.attendeesStore.loading(),
      this.adminsStore.loading(),
    ].some(Boolean)
  );

  newCapacity = signal(0);
  newAdminEmail = signal("");

  async ngOnInit() {
    const slug = this.route.snapshot.params["slug"];

    await this.eventDetailStore.loadEvent(slug);

    const evt = this.event();
    if (!evt?.isAdmin) {
      this.router.navigate(["/events", evt?.slug]);
      return;
    }

    this.newCapacity.set(evt.capacity);
    Promise.all([
      this.attendeesStore.loadAttendees(slug, evt.id),
      this.adminsStore.loadAdmins(slug, evt.id),
    ]);
  }

  ngOnDestroy() {
    this.eventDetailStore.leaveEventRoom();
  }

  async updateCapacity() {
    const evt = this.event();
    if (!evt || this.newCapacity() < 0) return;

    this.eventDetailStore.updateCapacity(this.newCapacity());
  }

  async removeAttendee(attendeeId: string) {
    const evt = this.event();
    if (!evt) return;

    if (!confirm("Are you sure you want to remove this attendee?")) return;

    this.attendeesStore.removeAttendee(evt.slug, attendeeId);
  }

  async addAdmin() {
    const evt = this.event();
    if (!evt || !this.newAdminEmail()) return;

    this.adminsStore.addAdmin(evt.slug, this.newAdminEmail());
  }

  async removeAdmin(adminEmail: string) {
    const evt = this.event();
    if (!evt) return;

    if (!confirm(`Remove ${adminEmail} as admin?`)) return;

    this.adminsStore.removeAdmin(evt.slug, adminEmail);
  }

  async deleteEvent() {
    const evt = this.event();
    if (!evt) return;

    if (
      !confirm(
        `Are you sure you want to delete "${evt.title}"? This action cannot be undone.`
      )
    )
      return;

    await this.eventDetailStore.deleteEvent(evt.slug);
    this.router.navigate(["/events"]);
  }
}
