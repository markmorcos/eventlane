import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  untracked,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink, ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";

import { EventDetailStore } from "../../stores/event-detail.store";
import { AuthService } from "../../services/auth.service";
import { SeoService } from "../../services/seo.service";
import { EventApiService } from "../../services/event-api.service";
import { ToastService } from "../../services/toast.service";
import { UserPreferencesService } from "../../services/user-preferences.service";
import { Meta } from "@angular/platform-browser";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";
import { HlmInputDirective } from "../../ui/ui-input-helm/src";
import {
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmCardContentDirective,
} from "../../ui/ui-card-helm/src";
import {
  HlmSkeletonComponent,
  HlmSkeletonTableRowComponent,
} from "../../ui/ui-skeleton-helm/src";
import { HlmAlertDialogComponent } from "../../ui/ui-alertdialog-helm/src";
import { TimezoneSelectorComponent } from "../timezone-selector/timezone-selector.component";
import { LocationInputComponent } from "../location-input/location-input.component";
import { ImageUploadComponent } from "../image-upload/image-upload.component";
import { Location } from "../../models/event.model";
import {
  formatEventDateTime,
  convertLocalDateTimeToUTC,
  convertUTCToLocalDateTime,
} from "../../utils/date-format";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-admin-event",
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HlmButtonDirective,
    HlmInputDirective,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardContentDirective,
    HlmSkeletonComponent,
    HlmSkeletonTableRowComponent,
    HlmAlertDialogComponent,
    TimezoneSelectorComponent,
    LocationInputComponent,
    ImageUploadComponent,
  ],
  templateUrl: "./admin-event.component.html",
})
export class AdminEventComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(EventDetailStore);
  private seoService = inject(SeoService);
  private meta = inject(Meta);
  private authService = inject(AuthService);
  private eventApiService = inject(EventApiService);
  private toastService = inject(ToastService);
  private preferencesService = inject(UserPreferencesService);

  email = this.authService.userEmail;
  event = this.store.event;
  confirmed = computed(() => this.store.event()?.confirmed || []);
  waitlisted = computed(() => this.store.event()?.waitlisted || []);
  admins = computed(() => this.store.event()?.admins || []);
  loading = this.store.loading;
  seriesSlug = signal<string | null>(null);

  eventCapacity = computed(() => this.store.event()?.capacity || 0);

  newCapacity = signal(0);
  newAdminEmail = signal("");

  // Metadata editing state
  editingDateTime = signal(false);
  editingLocation = signal(false);
  editingDescription = signal(false);
  editingCoverImage = signal(false);
  newEventDate = "";
  newTimezone = "";
  newLocation: Location | null = null;
  newDescription = "";
  language = this.preferencesService.language;

  formatEventDateTime(timestamp: number, timezone: string) {
    return formatEventDateTime(timestamp, timezone, this.language());
  }

  // Dialog state
  showRemoveAttendeeDialog = signal(false);
  showRemoveAdminDialog = signal(false);
  showDeleteEventDialog = signal(false);
  pendingAction = signal<{ type: string; email?: string } | null>(null);

  constructor() {
    effect(() => {
      const capacity = this.eventCapacity();
      const newCapacity = untracked(() => this.newCapacity());
      if (capacity !== newCapacity) {
        this.newCapacity.set(capacity);
      }
    });
  }

  async ngOnInit() {
    const eventSlug = this.route.snapshot.params["eventSlug"];
    const seriesSlug = this.route.snapshot.params["seriesSlug"];

    // Set noindex for admin pages
    this.meta.updateTag({ name: "robots", content: "noindex, nofollow" });
    this.seoService.removeStructuredData();

    await this.store.init(eventSlug);
    this.seriesSlug.set(seriesSlug);

    const evt = this.event();
    if (!evt) return;

    this.newCapacity.set(evt.capacity);
  }

  ngOnDestroy() {
    this.store.destroy();
  }

  navigateBack() {
    const slug = this.seriesSlug();
    if (slug) {
      this.router.navigate(["/admin/events", slug]);
    } else {
      this.router.navigate(["/admin/events"]);
    }
  }

  async updateCapacity() {
    const evt = this.event();
    if (!evt || this.newCapacity() < 0) return;

    this.store.updateCapacity(evt.slug, this.newCapacity());
  }

  async removeAttendee(email: string) {
    this.pendingAction.set({ type: "removeAttendee", email });
    this.showRemoveAttendeeDialog.set(true);
  }

  confirmRemoveAttendee() {
    const action = this.pendingAction();
    if (!action?.email) return;

    const evt = this.event();
    if (!evt) return;

    this.store.cancel(evt.slug, action.email);
    this.showRemoveAttendeeDialog.set(false);
    this.pendingAction.set(null);
  }

  async addAdmin() {
    const evt = this.event();
    if (!evt || !this.newAdminEmail()) return;

    this.store.addAdmin(evt.slug, this.newAdminEmail());
    this.newAdminEmail.set("");
  }

  async removeAdmin(adminEmail: string) {
    this.pendingAction.set({ type: "removeAdmin", email: adminEmail });
    this.showRemoveAdminDialog.set(true);
  }

  confirmRemoveAdmin() {
    const action = this.pendingAction();
    if (!action?.email) return;

    const evt = this.event();
    if (!evt) return;

    this.store.removeAdmin(evt.slug, action.email);
    this.showRemoveAdminDialog.set(false);
    this.pendingAction.set(null);
  }

  async deleteEvent() {
    this.showDeleteEventDialog.set(true);
  }

  async confirmDeleteEvent() {
    const evt = this.event();
    if (!evt) return;

    await this.store.deleteEvent(evt.slug);
    this.showDeleteEventDialog.set(false);
    this.router.navigate(["/events"]);
  }

  // Metadata editing methods
  startEditingDateTime() {
    const evt = this.event();
    if (!evt) return;
    this.newEventDate = convertUTCToLocalDateTime(evt.eventDate, evt.timezone);
    this.newTimezone = evt.timezone;
    this.editingDateTime.set(true);
  }

  cancelEditingDateTime() {
    this.editingDateTime.set(false);
  }

  async saveDateTime() {
    const evt = this.event();
    if (!evt) return;

    try {
      await firstValueFrom(
        this.eventApiService.updateMetadata(evt.slug, {
          eventDate: convertLocalDateTimeToUTC(
            this.newEventDate,
            this.newTimezone
          ),
          timezone: this.newTimezone,
        })
      );
      this.toastService.success("Date & time updated", "");
      this.editingDateTime.set(false);
    } catch (err) {
      this.toastService.error("Failed to update date & time", "");
      console.error(err);
    }
  }

  startEditingLocation() {
    const evt = this.event();
    if (!evt) return;
    this.newLocation = evt.location || null;
    this.editingLocation.set(true);
  }

  cancelEditingLocation() {
    this.editingLocation.set(false);
  }

  async saveLocation() {
    const evt = this.event();
    if (!evt) return;

    try {
      await firstValueFrom(
        this.eventApiService.updateMetadata(
          evt.slug,
          this.newLocation
            ? { location: this.newLocation }
            : { clearLocation: true }
        )
      );
      this.toastService.success("Location updated", "");
      this.editingLocation.set(false);
    } catch (err) {
      this.toastService.error("Failed to update location", "");
      console.error(err);
    }
  }

  startEditingDescription() {
    const evt = this.event();
    if (!evt) return;
    this.newDescription = evt.description || "";
    this.editingDescription.set(true);
  }

  cancelEditingDescription() {
    this.editingDescription.set(false);
  }

  async saveDescription() {
    const evt = this.event();
    if (!evt) return;

    try {
      await firstValueFrom(
        this.eventApiService.updateMetadata(evt.slug, {
          description: this.newDescription.trim() || "",
        })
      );
      this.toastService.success("Description updated", "");
      this.editingDescription.set(false);
    } catch (err) {
      this.toastService.error("Failed to update description", "");
      console.error(err);
    }
  }

  startEditingCoverImage() {
    this.editingCoverImage.set(true);
  }

  cancelEditingCoverImage() {
    this.editingCoverImage.set(false);
  }

  async saveCoverImage(blob: Blob) {
    const evt = this.event();
    if (!evt) return;

    try {
      await this.eventApiService.uploadCoverImage(evt.slug, blob);
      this.toastService.success("Cover image uploaded", "");
      this.editingCoverImage.set(false);
    } catch (err) {
      this.toastService.error("Failed to upload cover image", "");
      console.error(err);
    }
  }

  async removeCoverImage() {
    const evt = this.event();
    if (!evt) return;

    try {
      await firstValueFrom(this.eventApiService.deleteCoverImage(evt.slug));
      this.toastService.success("Cover image removed", "");
      this.editingCoverImage.set(false);
    } catch (err) {
      this.toastService.error("Failed to remove cover image", "");
      console.error(err);
    }
  }
}
