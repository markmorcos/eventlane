import { computed, Directive, input } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import type { ClassValue } from "clsx";

@Directive({
  selector: "[hlmLabel]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmLabelDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });
  public readonly error = input<boolean>(false);

  protected _computedClass = computed(() =>
    hlm(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      this.error() && "text-destructive",
      this.userClass()
    )
  );
}
