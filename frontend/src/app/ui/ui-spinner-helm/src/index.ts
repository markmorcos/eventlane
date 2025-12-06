import { Component, computed, input } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import { cva, type VariantProps } from "class-variance-authority";
import type { ClassValue } from "clsx";

export const spinnerVariants = cva(
  "animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        default: "h-4 w-4",
        sm: "h-3 w-3",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export type SpinnerVariants = VariantProps<typeof spinnerVariants>;

@Component({
  selector: "hlm-spinner",
  standalone: true,
  template: `<div [class]="_computedClass()"></div>`,
})
export class HlmSpinnerComponent {
  public readonly userClass = input<ClassValue>("", { alias: "class" });
  public readonly size = input<SpinnerVariants["size"]>("default");

  protected _computedClass = computed(() =>
    hlm(spinnerVariants({ size: this.size() }), this.userClass())
  );
}
