import { computed, Directive, input } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import type { ClassValue } from "clsx";

@Directive({
  selector: "[hlmTextarea]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmTextareaDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });
  public readonly error = input<boolean>(false);

  protected _computedClass = computed(() =>
    hlm(
      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      this.error() && "border-destructive focus-visible:ring-destructive",
      this.userClass()
    )
  );
}
