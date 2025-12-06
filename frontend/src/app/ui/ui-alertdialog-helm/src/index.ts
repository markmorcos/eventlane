import { Component, computed, input, output } from "@angular/core";
import { hlm } from "@spartan-ng/ui-core";
import type { ClassValue } from "clsx";
import { HlmButtonDirective } from "../../ui-button-helm/src";

@Component({
  selector: "hlm-alert-dialog",
  standalone: true,
  imports: [HlmButtonDirective],
  template: `
    @if (open()) {
    <div class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/80 animate-in fade-in-0"
        (click)="onCancel()"
      ></div>

      <!-- Dialog -->
      <div
        class="fixed z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg"
      >
        <div class="flex flex-col space-y-2 text-center sm:text-left">
          <h2 class="text-lg font-semibold">{{ title() }}</h2>
          @if (description()) {
          <p class="text-sm text-muted-foreground">{{ description() }}</p>
          }
        </div>
        <div
          class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
        >
          <button hlmBtn variant="outline" (click)="onCancel()">
            {{ cancelText() }}
          </button>
          <button
            hlmBtn
            [variant]="destructive() ? 'destructive' : 'default'"
            (click)="onConfirm()"
          >
            {{ confirmText() }}
          </button>
        </div>
      </div>
    </div>
    }
  `,
})
export class HlmAlertDialogComponent {
  public readonly open = input<boolean>(false);
  public readonly title = input<string>("Are you sure?");
  public readonly description = input<string>("");
  public readonly confirmText = input<string>("Continue");
  public readonly cancelText = input<string>("Cancel");
  public readonly destructive = input<boolean>(false);

  public readonly confirmed = output<void>();
  public readonly cancelled = output<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
