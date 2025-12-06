import { Component, computed, input, signal } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import { cva, type VariantProps } from "class-variance-authority";
import type { ClassValue } from "clsx";

export const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        default: "h-10 w-10",
        sm: "h-8 w-8",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export type AvatarVariants = VariantProps<typeof avatarVariants>;

@Component({
  selector: "hlm-avatar",
  standalone: true,
  template: `
    <span [class]="_computedClass()">
      @if (src() && !imageError()) {
        <img
          [src]="src()"
          [alt]="alt()"
          class="aspect-square h-full w-full object-cover"
          (error)="onImageError()"
        />
      } @else {
        <span
          class="flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground font-medium"
          [class.text-xs]="size() === 'sm'"
          [class.text-sm]="size() === 'default'"
          [class.text-base]="size() === 'lg'"
          [class.text-lg]="size() === 'xl'"
        >
          {{ initials() }}
        </span>
      }
    </span>
  `,
})
export class HlmAvatarComponent {
  public readonly userClass = input<ClassValue>("", { alias: "class" });
  public readonly src = input<string | null>(null);
  public readonly alt = input<string>("");
  public readonly fallback = input<string>("");
  public readonly size = input<AvatarVariants["size"]>("default");

  protected imageError = signal(false);

  protected _computedClass = computed(() =>
    hlm(avatarVariants({ size: this.size() }), this.userClass())
  );

  protected initials = computed(() => {
    const fallback = this.fallback();
    if (fallback) return fallback.slice(0, 2).toUpperCase();

    const alt = this.alt();
    if (!alt) return "?";

    const parts = alt.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return alt.slice(0, 2).toUpperCase();
  });

  onImageError() {
    this.imageError.set(true);
  }
}
