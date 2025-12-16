import { computed, Directive, input } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import { cva, type VariantProps } from "class-variance-authority";
import type { ClassValue } from "clsx";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

@Directive({
  selector: "[hlmBadge]",
  host: { "[class]": "_computedClass()" },
})
export class HlmBadgeDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });
  public readonly variant = input<BadgeVariants["variant"]>("default");

  protected _computedClass = computed(() =>
    hlm(badgeVariants({ variant: this.variant() }), this.userClass())
  );
}
