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
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

import { EventDetailStore } from "@eventlane/shared";
import { AuthService } from "@eventlane/shared";
import { SeoService } from "@eventlane/shared";
import { EventApiService } from "@eventlane/shared";
import { ToastService } from "@eventlane/shared";
import { UserPreferencesService } from "@eventlane/shared";
import { Meta } from "@angular/platform-browser";
import { HlmButtonDirective } from "@eventlane/shared";
import { HlmInputDirective } from "@eventlane/shared";
import {
  HlmCardDirective,
  HlmCardHeaderDirective,
  HlmCardTitleDirective,
  HlmCardContentDirective,
} from "@eventlane/shared";
import {
  HlmSkeletonComponent,
  HlmSkeletonTableRowComponent,
} from "@eventlane/shared";
import { HlmAlertDialogComponent } from "@eventlane/shared";
import { TimezoneSelectorComponent } from "@eventlane/shared";
import { LocationInputComponent } from "@eventlane/shared";
import { ImageUploadComponent } from "@eventlane/shared";
import { Location } from "@eventlane/shared";
import {
  formatEventDateTime,
  convertLocalDateTimeToUTC,
  convertUTCToLocalDateTime,
} from "@eventlane/shared";
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
  private translate = inject(TranslateService);

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
      this.router.navigate(["/events", slug]);
    } else {
      this.router.navigate(["/events"]);
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
      this.toastService.success(
        this.translate.instant("adminEvent.dateTimeUpdated")
      );
      this.editingDateTime.set(false);
    } catch (err) {
      this.toastService.error(
        this.translate.instant("adminEvent.dateTimeUpdateFailed")
      );
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
      this.toastService.success(
        this.translate.instant("adminEvent.locationUpdated")
      );
      this.editingLocation.set(false);
    } catch (err) {
      this.toastService.error(
        this.translate.instant("adminEvent.locationUpdateFailed")
      );
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
      this.toastService.success(
        this.translate.instant("adminEvent.descriptionUpdated")
      );
      this.editingDescription.set(false);
    } catch (err) {
      this.toastService.error(
        this.translate.instant("adminEvent.descriptionUpdateFailed")
      );
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
      this.toastService.success(
        this.translate.instant("adminEvent.coverImageUploaded")
      );
      this.editingCoverImage.set(false);
    } catch (err) {
      this.toastService.error(
        this.translate.instant("adminEvent.coverImageUploadFailed")
      );
      console.error(err);
    }
  }

  async removeCoverImage() {
    const evt = this.event();
    if (!evt) return;

    try {
      await firstValueFrom(this.eventApiService.deleteCoverImage(evt.slug));
      this.toastService.success(
        this.translate.instant("adminEvent.coverImageRemoved")
      );
      this.editingCoverImage.set(false);
    } catch (err) {
      this.toastService.error(
        this.translate.instant("adminEvent.coverImageRemoveFailed")
      );
      console.error(err);
    }
  }
}
