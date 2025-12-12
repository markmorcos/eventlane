import {
  Component,
  OnInit,
  ViewChild,
  input,
  output,
  effect,
  signal,
  inject,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Location } from "../../models/event.model";
import { HlmInputDirective } from "../../ui/ui-input-helm/src";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";
import { HlmLabelDirective } from "../../ui/ui-label-helm/src";

@Component({
  selector: "app-location-input",
  imports: [
    FormsModule,
    HlmInputDirective,
    HlmButtonDirective,
    HlmLabelDirective,
  ],
  template: `
    <div class="space-y-3">
      <!-- Google Places Search -->
      <div class="relative">
        <label hlmLabel class="mb-1.5">Search for a place</label>
        <input
          #searchInput
          hlmInput
          type="text"
          [(ngModel)]="searchQuery"
          (input)="onSearchChange()"
          placeholder="Search Google Places..."
          class="pr-20"
        />
        @if (searchQuery()) {
        <button
          type="button"
          hlmBtn
          variant="ghost"
          size="sm"
          (click)="clearSearch()"
          class="absolute right-1 top-8 h-8"
        >
          Clear
        </button>
        }
      </div>

      @if (predictions().length > 0 && showDropdown()) {
      <div
        class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-lg"
      >
        @for (prediction of predictions(); track prediction.place_id) {
        <button
          type="button"
          class="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
          (click)="selectPrediction(prediction)"
        >
          <div class="font-medium">
            {{ prediction.structured_formatting.main_text }}
          </div>
          <div class="text-xs text-muted-foreground">
            {{ prediction.structured_formatting.secondary_text }}
          </div>
        </button>
        }
      </div>
      }

      <!-- Manual Place Name -->
      <div>
        <label hlmLabel class="mb-1.5">Place Name (Display)</label>
        <input
          hlmInput
          type="text"
          [(ngModel)]="displayName"
          (input)="onDisplayNameChange()"
          placeholder="Enter place name..."
        />
      </div>

      @if (location() && (location()!.lat || location()!.lng)) {
      <div class="rounded-md border bg-muted/50 p-3 text-sm">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1">
            <div class="text-xs text-muted-foreground">
              {{ location()!.lat }}, {{ location()!.lng }}
            </div>
            @if (location()!.city || location()!.country) {
            <div class="text-xs text-muted-foreground mt-1">
              {{ getLocationSummary(location()!) }}
            </div>
            }
          </div>
          <button
            type="button"
            hlmBtn
            variant="ghost"
            size="sm"
            (click)="clearLocation()"
          >
            Clear
          </button>
        </div>
      </div>
      }

      <small class="text-sm text-muted-foreground">
        Search using Google Places or enter a place name manually
      </small>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }
  `,
})
export class LocationInputComponent implements OnInit {
  public readonly location = input<Location | null>(null);
  public readonly locationChange = output<Location | null>();

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild("searchInput") searchInputRef!: HTMLInputElement;
  protected searchQuery = signal<string>("");
  protected displayName = signal<string>("");
  protected predictions = signal<any[]>([]);
  protected showDropdown = signal<boolean>(false);

  private autocompleteService: any;
  private placesService: any;

  constructor() {
    // Initialize from input location
    effect(() => {
      const loc = this.location();
      if (loc) {
        this.displayName.set(loc.formatted || "");
      }
    });
  }

  ngOnInit(): void {
    // Only initialize Google Places services in the browser
    if (this.isBrowser && typeof (window as any).google !== "undefined") {
      const google = (window as any).google;
      this.autocompleteService = new google.maps.places.AutocompleteService();

      // Create a hidden div for PlacesService (it requires a map or div)
      const hiddenDiv = document.createElement("div");
      this.placesService = new google.maps.places.PlacesService(hiddenDiv);
    }
  }

  protected onSearchChange(): void {
    if (!this.isBrowser || !this.autocompleteService) {
      return;
    }

    const query = this.searchQuery();

    if (!query || query.length < 3) {
      this.predictions.set([]);
      this.showDropdown.set(false);
      return;
    }

    const google = (window as any).google;
    this.autocompleteService.getPlacePredictions(
      {
        input: query,
        types: ["geocode", "establishment"],
      },
      (predictions: any, status: any) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          this.predictions.set(predictions.slice(0, 5));
          this.showDropdown.set(true);
        } else {
          this.predictions.set([]);
          this.showDropdown.set(false);
        }
      }
    );
  }

  protected selectPrediction(prediction: any): void {
    if (!this.isBrowser || !this.placesService) {
      return;
    }

    const google = (window as any).google;
    this.placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["name", "address_components", "formatted_address", "geometry"],
      },
      (place: any, status: any) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          this.parsePlace(prediction.place_id, place);
          this.displayName.set(place.name || place.formatted_address || "");
          this.searchQuery.set("");
          this.showDropdown.set(false);
          this.predictions.set([]);
        }
      }
    );
  }

  protected clearSearch(): void {
    this.searchQuery.set("");
    this.predictions.set([]);
    this.showDropdown.set(false);
  }

  protected onDisplayNameChange(): void {
    const name = this.displayName();

    // If there's a current location with coordinates, update its formatted name
    const currentLocation = this.location();
    if (currentLocation && (currentLocation.lat || currentLocation.lng)) {
      this.locationChange.emit({
        ...currentLocation,
        formatted: name,
      });
    } else if (name.trim()) {
      // Create a minimal location with just the name
      this.locationChange.emit({
        formatted: name.trim(),
      });
    } else {
      // Clear location if name is empty
      this.locationChange.emit(null);
    }
  }

  protected clearLocation(): void {
    this.searchQuery.set("");
    this.displayName.set("");
    this.predictions.set([]);
    this.showDropdown.set(false);
    this.locationChange.emit(null);
  }

  private parsePlace(placeId: string, place: any): void {
    if (!this.isBrowser) {
      return;
    }

    const components: any[] = place.address_components || [];

    const getComponent = (type: string): string | undefined => {
      const component = components.find((c) => c.types.includes(type));
      return component?.long_name;
    };

    const location: Location = {
      streetNumber: getComponent("street_number"),
      street: getComponent("route"),
      additional: undefined,
      neighborhood: getComponent("neighborhood") || getComponent("sublocality"),
      city: getComponent("locality") || getComponent("postal_town"),
      state: getComponent("administrative_area_level_1"),
      postalCode: getComponent("postal_code"),
      country: getComponent("country"),
      countryCode: components.find((c) => c.types.includes("country"))
        ?.short_name,
      lat: place.geometry?.location?.lat(),
      lng: place.geometry?.location?.lng(),
      formatted: place.name || place.formatted_address || "",
      placeId,
    };

    this.locationChange.emit(location);
  }

  protected getLocationSummary(location: Location): string {
    return [location.city, location.country].filter((v) => !!v).join(", ");
  }
}
