import { Component, OnInit, OnDestroy } from "@angular/core";
import { HeroComponent } from "./hero/hero.component";
import { FeaturesComponent } from "./features/features.component";
import { HowItWorksComponent } from "./how-it-works/how-it-works.component";
import { FooterComponent } from "./footer/footer.component";
import { SeoService } from "../../services/seo.service";

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [
    HeroComponent,
    FeaturesComponent,
    HowItWorksComponent,
    FooterComponent,
  ],
  templateUrl: "./landing.component.html",
})
export class LandingComponent implements OnInit, OnDestroy {
  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    // Update SEO tags for landing page
    this.seoService.updateTags({
      title:
        "EventLane - Fast & Simple Event Management | RSVP & Waitlist Platform",
      description:
        "Create events, manage RSVPs, and handle waitlists automatically with EventLane. Real-time updates, one-click authentication, and automatic capacity control make event management effortless.",
      keywords:
        "event management software, RSVP platform, waitlist management, event registration, online event planning, event capacity control",
      url: "/",
      type: "website",
    });

    // Add structured data for Organization
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "EventLane",
      url: "https://eventlane.io",
      logo: "https://eventlane.io/android-chrome-512x512.png",
      description:
        "Fast and simple event management platform with automatic RSVP and waitlist handling",
      foundingDate: "2024",
      sameAs: [],
    };

    // Add structured data for WebSite with search action
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "EventLane",
      url: "https://eventlane.io",
      description: "Fast and simple event management platform",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://eventlane.io/events?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    };

    // Combine schemas into a graph
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [organizationSchema, websiteSchema],
    };

    this.seoService.addStructuredData(structuredData);
  }

  ngOnDestroy(): void {
    this.seoService.removeStructuredData();
  }
}
