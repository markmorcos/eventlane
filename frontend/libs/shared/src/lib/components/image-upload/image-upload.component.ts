import { Component, input, output, signal } from "@angular/core";
import { ImageCroppedEvent, ImageCropperComponent } from "ngx-image-cropper";
import { HlmButtonDirective } from "../../ui/ui-button-helm/src";

@Component({
  selector: "app-image-upload",
  imports: [ImageCropperComponent, HlmButtonDirective],
  template: `
    <div class="space-y-4">
      @if (!imageChangedEvent() && !currentImageUrl()) {
      <div
        class="rounded-md border-2 border-dashed border-border p-8 text-center"
      >
        <input
          #fileInput
          type="file"
          accept="image/*"
          (change)="fileChangeEvent($event)"
          class="hidden"
        />
        <button
          type="button"
          hlmBtn
          variant="outline"
          (click)="fileInput.click()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="mr-2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          Choose Image
        </button>
        <p class="mt-2 text-sm text-muted-foreground">
          Upload a 16:9 cover image for your event
        </p>
      </div>
      } @if (imageChangedEvent()) {
      <div class="space-y-4">
        <div class="rounded-md border bg-card overflow-hidden">
          <image-cropper
            [imageChangedEvent]="imageChangedEvent()"
            [maintainAspectRatio]="true"
            [aspectRatio]="16 / 9"
            [resizeToWidth]="1920"
            format="webp"
            (imageCropped)="imageCropped($event)"
            [cropperMinWidth]="640"
            outputType="base64"
          />
        </div>

        <div class="flex gap-2">
          <button type="button" hlmBtn (click)="confirmCrop()">
            Confirm & Upload
          </button>
          <button type="button" hlmBtn variant="outline" (click)="cancelCrop()">
            Cancel
          </button>
        </div>

        <small class="text-sm text-muted-foreground block">
          Adjust the crop area to fit your image in 16:9 aspect ratio
        </small>
      </div>
      } @if (currentImageUrl() && !imageChangedEvent()) {
      <div class="space-y-3">
        <div class="rounded-md border overflow-hidden">
          <img
            [src]="currentImageUrl()"
            alt="Cover image"
            class="w-full h-auto"
          />
        </div>

        <div class="flex gap-2">
          <input
            #fileInput2
            type="file"
            accept="image/*"
            (change)="fileChangeEvent($event)"
            class="hidden"
          />
          <button
            type="button"
            hlmBtn
            variant="outline"
            size="sm"
            (click)="fileInput2.click()"
          >
            Change Image
          </button>
          <button
            type="button"
            hlmBtn
            variant="destructive"
            size="sm"
            (click)="removeImage()"
          >
            Remove
          </button>
        </div>
      </div>
      } @if (uploading()) {
      <div class="text-sm text-muted-foreground">Uploading image...</div>
      }
    </div>
  `,
})
export class ImageUploadComponent {
  public readonly currentImageUrl = input<string | undefined>(undefined);
  public readonly imageUploaded = output<Blob>();
  public readonly imageRemoved = output<void>();

  protected imageChangedEvent = signal<Event | null>(null);
  protected croppedImage = signal<Blob | null>(null);
  protected uploading = signal<boolean>(false);

  protected fileChangeEvent(event: Event): void {
    this.imageChangedEvent.set(event);
  }

  protected imageCropped(event: ImageCroppedEvent): void {
    if (event.blob) {
      this.croppedImage.set(event.blob);
    }
  }

  protected async confirmCrop(): Promise<void> {
    const blob = this.croppedImage();
    if (!blob) return;

    this.uploading.set(true);
    this.imageUploaded.emit(blob);
    this.imageChangedEvent.set(null);
    this.croppedImage.set(null);
    this.uploading.set(false);
  }

  protected cancelCrop(): void {
    this.imageChangedEvent.set(null);
    this.croppedImage.set(null);
  }

  protected removeImage(): void {
    this.imageRemoved.emit();
  }
}
