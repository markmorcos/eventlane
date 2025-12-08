import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { Meta, Title } from "@angular/platform-browser";

export interface SeoData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

@Injectable({
  providedIn: "root",
})
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private defaultTitle = "EventLane - Fast & Simple Event Management";
  private defaultDescription =
    "Create events, manage RSVPs, and handle waitlists automatically with EventLane. Real-time updates, one-click authentication, and automatic capacity control make event management effortless.";
  private defaultImage = "https://eventlane.io/og-image.png";
  private baseUrl = "https://eventlane.io";

  constructor() {}

  updateTags(seoData: SeoData): void {
    const title = seoData.title || this.defaultTitle;
    const description = seoData.description || this.defaultDescription;
    const image = seoData.image || this.defaultImage;
    const url = seoData.url ? `${this.baseUrl}${seoData.url}` : this.baseUrl;
    const type = seoData.type || "website";

    this.title.setTitle(title);

    this.meta.updateTag({ name: "title", content: title });
    this.meta.updateTag({ name: "description", content: description });

    if (seoData.keywords) {
      this.meta.updateTag({ name: "keywords", content: seoData.keywords });
    }

    this.updateCanonicalUrl(url);

    this.meta.updateTag({ property: "og:type", content: type });
    this.meta.updateTag({ property: "og:url", content: url });
    this.meta.updateTag({ property: "og:title", content: title });
    this.meta.updateTag({ property: "og:description", content: description });
    this.meta.updateTag({ property: "og:image", content: image });

    this.meta.updateTag({ name: "twitter:url", content: url });
    this.meta.updateTag({ name: "twitter:title", content: title });
    this.meta.updateTag({ name: "twitter:description", content: description });
    this.meta.updateTag({ name: "twitter:image", content: image });
  }

  updateCanonicalUrl(url: string) {
    if (!this.isBrowser) return;

    let link: HTMLLinkElement | null = document.querySelector(
      'link[rel="canonical"]'
    );

    if (link) {
      link.setAttribute("href", url);
    } else {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", url);
      document.head.appendChild(link);
    }
  }

  addStructuredData(data: any) {
    if (!this.isBrowser) return;

    let script: HTMLScriptElement | null = document.querySelector(
      'script[type="application/ld+json"]'
    );

    if (script) {
      script.textContent = JSON.stringify(data);
    } else {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(data);
      document.head.appendChild(script);
    }
  }

  removeStructuredData(): void {
    if (!this.isBrowser) return;

    const script = document.querySelector('script[type="application/ld+json"]');
    if (script) {
      script.remove();
    }
  }
}
