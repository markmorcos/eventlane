import { Component, computed, input, output, signal, HostListener, ElementRef, inject } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import type { ClassValue } from "clsx";

@Component({
  selector: "hlm-menu",
  standalone: true,
  template: `
    <div class="relative inline-block text-left">
      <div (click)="toggle()">
        <ng-content select="[trigger]" />
      </div>

      @if (isOpen()) {
        <div
          class="absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          [class.right-0]="align() === 'end'"
          [class.left-0]="align() === 'start'"
        >
          <ng-content />
        </div>
      }
    </div>
  `,
  host: {
    "(document:click)": "onDocumentClick($event)",
  },
})
export class HlmMenuComponent {
  private elementRef = inject(ElementRef);

  public readonly align = input<"start" | "end">("end");
  public readonly isOpen = signal(false);

  toggle() {
    this.isOpen.update((v) => !v);
  }

  close() {
    this.isOpen.set(false);
  }

  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}

@Component({
  selector: "hlm-menu-item",
  standalone: true,
  template: `
    <button
      class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
      [class.text-destructive]="variant() === 'destructive'"
      [disabled]="disabled()"
    >
      <ng-content />
    </button>
  `,
})
export class HlmMenuItemComponent {
  public readonly variant = input<"default" | "destructive">("default");
  public readonly disabled = input<boolean>(false);
}

@Component({
  selector: "hlm-menu-separator",
  standalone: true,
  template: `<div class="-mx-1 my-1 h-px bg-muted"></div>`,
})
export class HlmMenuSeparatorComponent {}

@Component({
  selector: "hlm-menu-label",
  standalone: true,
  template: `<div class="px-2 py-1.5 text-sm font-semibold"><ng-content /></div>`,
})
export class HlmMenuLabelComponent {}

export const HlmMenuComponents = [
  HlmMenuComponent,
  HlmMenuItemComponent,
  HlmMenuSeparatorComponent,
  HlmMenuLabelComponent,
] as const;
