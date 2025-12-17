import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  inject,
} from "@angular/core";

/**
 * Optimized image loading directive with lazy loading and aspect ratio preservation
 * Similar to Angular's NgOptimizedImage but simpler
 */
@Directive({
  selector: "img[appOptimizedImage]",
  standalone: true,
})
export class OptimizedImageDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @Input() width?: number | string;
  @Input() height?: number | string;
  @Input() priority = false; // Set to true for above-the-fold images

  ngOnInit() {
    const img = this.el.nativeElement as HTMLImageElement;

    // Add loading attribute (eager for priority images, lazy for others)
    this.renderer.setAttribute(
      img,
      "loading",
      this.priority ? "eager" : "lazy"
    );

    // Add decoding attribute for better performance
    this.renderer.setAttribute(img, "decoding", "async");

    // Set explicit width/height if provided to prevent layout shift
    if (this.width) {
      this.renderer.setAttribute(img, "width", String(this.width));
    }
    if (this.height) {
      this.renderer.setAttribute(img, "height", String(this.height));
    }

    // Add fetchpriority for priority images
    if (this.priority) {
      this.renderer.setAttribute(img, "fetchpriority", "high");
    }
  }
}
