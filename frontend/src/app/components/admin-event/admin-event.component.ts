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

import { EventDetailStore } from "../../stores/event-detail.store";
import { AuthService } from "../../services/auth.service";
import { SeoService } from "../../services/seo.service";
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

@Component({
  selector: "app-admin-event",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    HlmButtonDirective,
    HlmInputDirective,
    HlmCardDirective,
    HlmCardHeaderDirective,
    HlmCardTitleDirective,
    HlmCardContentDirective,
    HlmSkeletonComponent,
    HlmSkeletonTableRowComponent,
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

  email = this.authService.userEmail;
  event = this.store.event;
  confirmed = computed(() => this.store.event()?.confirmed || []);
  waitlisted = computed(() => this.store.event()?.waitlisted || []);
  admins = computed(() => this.store.event()?.admins || []);
  loading = this.store.loading;

  eventCapacity = computed(() => this.store.event()?.capacity || 0);

  newCapacity = signal(0);
  newAdminEmail = signal("");

  constructor() {
    effect(
      () => {
        const capacity = this.eventCapacity();
        const newCapacity = untracked(() => this.newCapacity());
        if (capacity !== newCapacity) {
          this.newCapacity.set(capacity);
        }
      },
      { allowSignalWrites: true }
    );
  }

  async ngOnInit() {
    const slug = this.route.snapshot.params["slug"];

    // Set noindex for admin pages
    this.meta.updateTag({ name: "robots", content: "noindex, nofollow" });
    this.seoService.removeStructuredData();

    await this.store.init(slug);

    const evt = this.event();
    if (!evt?.isAdmin) {
      this.router.navigate(["/events", evt?.slug]);
      return;
    }

    this.newCapacity.set(evt.capacity);
  }

  ngOnDestroy() {
    this.store.destroy();
  }

  async updateCapacity() {
    const evt = this.event();
    if (!evt || this.newCapacity() < 0) return;

    this.store.updateCapacity(evt.slug, this.newCapacity());
  }

  async removeAttendee(email: string) {
    const evt = this.event();
    if (!evt) return;

    if (!confirm("Are you sure you want to remove this attendee?")) return;

    this.store.cancel(evt.slug, email);
  }

  async addAdmin() {
    const evt = this.event();
    if (!evt || !this.newAdminEmail()) return;

    this.store.addAdmin(evt.slug, this.newAdminEmail());
    this.newAdminEmail.set("");
  }

  async removeAdmin(adminEmail: string) {
    const evt = this.event();
    if (!evt) return;

    if (!confirm(`Remove ${adminEmail} as admin?`)) return;

    this.store.removeAdmin(evt.slug, adminEmail);
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

    await this.store.deleteEvent(evt.slug);
    this.router.navigate(["/events"]);
  }
}
