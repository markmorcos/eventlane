import { Component, computed, input, output, signal } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import { cva, type VariantProps } from "class-variance-authority";
import type { ClassValue } from "clsx";
import { HlmButtonDirective } from "../../ui-button-helm/src";

export const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "border-success/50 text-success dark:border-success [&>svg]:text-success",
        warning:
          "border-warning/50 text-warning dark:border-warning [&>svg]:text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type AlertVariants = VariantProps<typeof alertVariants>;

@Component({
  selector: "hlm-alert",
  standalone: true,
  template: `
    <div [class]="_computedClass()">
      <ng-content />
    </div>
  `,
})
export class HlmAlertComponent {
  public readonly userClass = input<ClassValue>("", { alias: "class" });
  public readonly variant = input<AlertVariants["variant"]>("default");

  protected _computedClass = computed(() =>
    hlm(alertVariants({ variant: this.variant() }), this.userClass())
  );
}

@Component({
  selector: "hlm-alert-title",
  standalone: true,
  template: `<h5 class="mb-1 font-medium leading-none tracking-tight">
    <ng-content />
  </h5>`,
})
export class HlmAlertTitleComponent {}

@Component({
  selector: "hlm-alert-description",
  standalone: true,
  template: `<div class="text-sm [&_p]:leading-relaxed"><ng-content /></div>`,
})
export class HlmAlertDescriptionComponent {}

export const HlmAlertComponents = [
  HlmAlertComponent,
  HlmAlertTitleComponent,
  HlmAlertDescriptionComponent,
] as const;
