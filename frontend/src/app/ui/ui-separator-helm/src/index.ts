import { computed, Directive, input } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import type { ClassValue } from "clsx";

@Directive({
  selector: "[hlmSeparator]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
    role: "separator",
  },
})
export class HlmSeparatorDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });
  public readonly orientation = input<"horizontal" | "vertical">("horizontal");

  protected _computedClass = computed(() =>
    hlm(
      "shrink-0 bg-border",
      this.orientation() === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      this.userClass()
    )
  );
}
