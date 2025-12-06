import { Component, computed, input } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import type { ClassValue } from "clsx";

@Component({
  selector: "hlm-skeleton",
  standalone: true,
  template: ``,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmSkeletonComponent {
  public readonly userClass = input<ClassValue>("", { alias: "class" });

  protected _computedClass = computed(() =>
    hlm("animate-pulse rounded-md bg-muted", this.userClass())
  );
}

// Skeleton presets for common use cases
@Component({
    selector: "hlm-skeleton-card",
    imports: [HlmSkeletonComponent],
    template: `
    <div class="rounded-lg border bg-card p-6 shadow-sm">
      <div class="space-y-4">
        <hlm-skeleton class="h-6 w-3/4" />
        <hlm-skeleton class="h-4 w-1/2" />
        <div class="space-y-2 pt-4">
          <hlm-skeleton class="h-4 w-full" />
          <hlm-skeleton class="h-4 w-5/6" />
        </div>
        <div class="flex gap-2 pt-4">
          <hlm-skeleton class="h-10 w-24" />
          <hlm-skeleton class="h-10 w-24" />
        </div>
      </div>
    </div>
  `
})
export class HlmSkeletonCardComponent {}

@Component({
    selector: "hlm-skeleton-table-row",
    imports: [HlmSkeletonComponent],
    template: `
    <div class="flex items-center space-x-4 py-4 border-b">
      <hlm-skeleton class="h-10 w-10 rounded-full" />
      <div class="space-y-2 flex-1">
        <hlm-skeleton class="h-4 w-1/3" />
        <hlm-skeleton class="h-3 w-1/4" />
      </div>
      <hlm-skeleton class="h-8 w-20" />
    </div>
  `
})
export class HlmSkeletonTableRowComponent {}

@Component({
    selector: "hlm-skeleton-list",
    imports: [HlmSkeletonComponent],
    template: `
    <div class="space-y-3">
      @for (_ of items(); track $index) {
      <div class="flex items-center space-x-4">
        <hlm-skeleton class="h-12 w-12 rounded-full" />
        <div class="space-y-2 flex-1">
          <hlm-skeleton class="h-4 w-1/2" />
          <hlm-skeleton class="h-3 w-1/3" />
        </div>
      </div>
      }
    </div>
  `
})
export class HlmSkeletonListComponent {
  public readonly count = input<number>(3);
  protected items = computed(() => Array(this.count()).fill(0));
}

export const HlmSkeletonComponents = [
  HlmSkeletonComponent,
  HlmSkeletonCardComponent,
  HlmSkeletonTableRowComponent,
  HlmSkeletonListComponent,
] as const;
