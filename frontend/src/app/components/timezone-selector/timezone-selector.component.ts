import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HlmInputDirective } from "../../ui/ui-input-helm/src";
import { HlmLabelDirective } from "../../ui/ui-label-helm/src";
import { searchTimezones, getTimezoneDisplayName } from "../../utils/timezones";

@Component({
  selector: "app-timezone-selector",
  imports: [FormsModule, HlmInputDirective, HlmLabelDirective],
  template: `
    <div class="space-y-2">
      <label hlmLabel [for]="inputId()">{{ label() }}</label>

      <div class="relative">
        <input
          hlmInput
          [id]="inputId()"
          type="text"
          [(ngModel)]="searchQuery"
          [placeholder]="placeholder()"
          (focus)="showDropdown.set(true)"
          (blur)="onBlur()"
          (input)="onSearch()"
          autocomplete="off"
          class="w-full"
        />

        @if (showDropdown()) {
        <div
          class="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto"
        >
          @if (filteredTimezones().length === 0) {
          <div class="px-3 py-2 text-sm text-muted-foreground">
            No timezones found
          </div>
          } @else { @for (tz of filteredTimezones(); track tz) {
          <button
            type="button"
            class="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
            [class.bg-accent]="tz === selectedTimezone()"
            (mousedown)="selectTimezone(tz)"
          >
            {{ getTimezoneDisplayName(tz) }}
          </button>
          } }
        </div>
        }
      </div>

      @if (showHint()) {
      <small class="text-sm text-muted-foreground">
        {{ hint() }}
      </small>
      }
    </div>
  `,
})
export class TimezoneSelectorComponent {
  label = input<string>("Timezone");
  placeholder = input<string>("Search timezones...");
  hint = input<string>("");
  showHint = input<boolean>(true);
  inputId = input<string>("timezone");
  timezone = input.required<string>();
  timezoneChange = output<string>();

  searchQuery = signal<string>("");
  showDropdown = signal<boolean>(false);
  selectedTimezone = signal<string>("");

  filteredTimezones = computed(() => {
    const query = this.searchQuery();
    return searchTimezones(query).slice(0, 50); // Limit to 50 results for performance
  });

  constructor() {
    // Initialize with current timezone display
    effect(() => {
      const tz = this.timezone();
      this.selectedTimezone.set(tz);
      this.searchQuery.set(getTimezoneDisplayName(tz));
    });
  }

  getTimezoneDisplayName = getTimezoneDisplayName;

  onSearch() {
    this.showDropdown.set(true);
  }

  selectTimezone(tz: string) {
    this.selectedTimezone.set(tz);
    this.searchQuery.set(getTimezoneDisplayName(tz));
    this.showDropdown.set(false);
    this.timezoneChange.emit(tz);
  }

  onBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showDropdown.set(false);
      // Restore display name if search was partial
      if (this.selectedTimezone()) {
        this.searchQuery.set(getTimezoneDisplayName(this.selectedTimezone()));
      }
    }, 200);
  }
}
