import { Component, OnInit, OnDestroy, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { ApiService } from "../../services/api.service";
import { EventStateService } from "../../services/event-state.service";

@Component({
  selector: "app-admin-event",
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: "./admin-event.component.html",
  styleUrls: ["./admin-event.component.scss"],
})
export class AdminEventComponent implements OnInit, OnDestroy {
  event = this.eventStateService.currentEvent;
  attendees = this.eventStateService.currentAttendees;
  admins: string[] = [];
  newCapacity: number = 0;
  newAdminEmail = "";
  submitting = false;
  message = "";
  isError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private eventStateService: EventStateService
  ) {
    effect(() => {
      const evt = this.event();
      if (evt) {
        this.newCapacity = evt.capacity;
        if (!evt.isAdmin) {
          this.router.navigate(["/events", evt.slug]);
        }
      }
    });
  }

  async ngOnInit() {
    const slug = this.route.snapshot.params["slug"];

    await this.eventStateService.loadEvent(slug);

    const evt = this.event();
    if (evt) {
      await this.eventStateService.loadAttendees(slug, evt.id);
      this.loadAdmins(slug);
    }
  }

  ngOnDestroy() {
    this.eventStateService.leaveEventRoom();
  }

  loadAdmins(slug: string) {
    this.apiService.getAdmins(slug).subscribe({
      next: (admins) => {
        this.admins = admins;
      },
      error: (error) => {
        console.error("Error loading admins:", error);
      },
    });
  }

  async updateCapacity() {
    const evt = this.event();
    if (!evt || this.newCapacity < 0) return;

    this.submitting = true;

    try {
      const result = await firstValueFrom(
        this.apiService.updateCapacity(evt.slug, {
          capacity: this.newCapacity,
        })
      );

      let msg = "Capacity updated successfully";
      if (result!.promoted.length > 0) {
        msg += ` (${result!.promoted.length} promoted from waitlist)`;
      }
      if (result!.demoted.length > 0) {
        msg += ` (${result!.demoted.length} moved to waitlist)`;
      }

      this.showMessage(msg, false);
    } catch (error: any) {
      console.error("Error updating capacity:", error);
      this.showMessage("Failed to update capacity", true);
    } finally {
      this.submitting = false;
    }
  }

  async removeAttendee(attendeeId: string) {
    const evt = this.event();
    if (!evt) return;

    if (!confirm("Are you sure you want to remove this attendee?")) return;

    try {
      await firstValueFrom(
        this.apiService.removeAttendee(evt.slug, attendeeId)
      );
      this.showMessage("Attendee removed successfully", false);
    } catch (error: any) {
      console.error("Error removing attendee:", error);
      this.showMessage("Failed to remove attendee", true);
    }
  }

  async addAdmin() {
    const evt = this.event();
    if (!evt || !this.newAdminEmail) return;

    this.submitting = true;

    try {
      await firstValueFrom(
        this.apiService.addAdmin(evt.slug, {
          adminEmail: this.newAdminEmail,
        })
      );

      this.admins.push(this.newAdminEmail);
      this.newAdminEmail = "";
      this.showMessage("Admin added successfully", false);
    } catch (error: any) {
      console.error("Error adding admin:", error);
      this.showMessage("Failed to add admin", true);
    } finally {
      this.submitting = false;
    }
  }

  async removeAdmin(adminEmail: string) {
    const evt = this.event();
    if (!evt) return;

    if (this.admins.length === 1) {
      this.showMessage("Cannot remove the last admin", true);
      return;
    }

    if (!confirm(`Remove ${adminEmail} as admin?`)) return;

    try {
      await firstValueFrom(
        this.apiService.removeAdmin(evt.slug, { adminEmail })
      );
      this.admins = this.admins.filter((a) => a !== adminEmail);
      this.showMessage("Admin removed successfully", false);
    } catch (error: any) {
      console.error("Error removing admin:", error);
      this.showMessage("Failed to remove admin", true);
    }
  }

  async deleteEvent() {
    const evt = this.event();
    if (!evt) return;

    const confirmed = confirm(
      `Are you sure you want to delete "${evt.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await firstValueFrom(this.apiService.deleteEvent(evt.slug));
      this.router.navigate(["/events"]);
    } catch (error: any) {
      console.error("Error deleting event:", error);
      this.showMessage("Failed to delete event", true);
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
