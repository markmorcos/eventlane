import { computed, Directive, input } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import { cva, type VariantProps } from "class-variance-authority";
import type { ClassValue } from "clsx";

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-success text-success-foreground hover:bg-success/90",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90",
      },
      size: {
        default: "h-9 px-3 py-1.5",
        sm: "h-8 rounded-md px-2.5 text-xs",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

@Directive({
  selector: "[hlmBtn]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmButtonDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });
  public readonly variant = input<ButtonVariants["variant"]>("default");
  public readonly size = input<ButtonVariants["size"]>("default");
  public readonly loading = input<boolean>(false);

  protected _computedClass = computed(() =>
    hlm(
      buttonVariants({ variant: this.variant(), size: this.size() }),
      this.loading() && "opacity-70 pointer-events-none",
      this.userClass(),
    ),
  );
}
