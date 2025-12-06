import { computed, Directive, input } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import type { ClassValue } from "clsx";

@Directive({
  selector: "[hlmTable]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmTableDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });

  protected _computedClass = computed(() =>
    hlm("w-full caption-bottom text-sm", this.userClass())
  );
}

@Directive({
  selector: "[hlmTableHeader]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmTableHeaderDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });

  protected _computedClass = computed(() =>
    hlm("[&_tr]:border-b", this.userClass())
  );
}

@Directive({
  selector: "[hlmTableBody]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmTableBodyDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });

  protected _computedClass = computed(() =>
    hlm("[&_tr:last-child]:border-0", this.userClass())
  );
}

@Directive({
  selector: "[hlmTableRow]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmTableRowDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });

  protected _computedClass = computed(() =>
    hlm(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      this.userClass()
    )
  );
}

@Directive({
  selector: "[hlmTableHead]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmTableHeadDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });

  protected _computedClass = computed(() =>
    hlm(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      this.userClass()
    )
  );
}

@Directive({
  selector: "[hlmTableCell]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmTableCellDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });

  protected _computedClass = computed(() =>
    hlm("p-4 align-middle [&:has([role=checkbox])]:pr-0", this.userClass())
  );
}

@Directive({
  selector: "[hlmTableCaption]",
  standalone: true,
  host: {
    "[class]": "_computedClass()",
  },
})
export class HlmTableCaptionDirective {
  public readonly userClass = input<ClassValue>("", { alias: "class" });

  protected _computedClass = computed(() =>
    hlm("mt-4 text-sm text-muted-foreground", this.userClass())
  );
}

export const HlmTableDirectives = [
  HlmTableDirective,
  HlmTableHeaderDirective,
  HlmTableBodyDirective,
  HlmTableRowDirective,
  HlmTableHeadDirective,
  HlmTableCellDirective,
  HlmTableCaptionDirective,
] as const;
