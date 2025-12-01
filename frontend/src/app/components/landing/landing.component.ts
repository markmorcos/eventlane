import { Component } from "@angular/core";
import { HeroComponent } from "./hero/hero.component";
import { FeaturesComponent } from "./features/features.component";
import { HowItWorksComponent } from "./how-it-works/how-it-works.component";
import { FooterComponent } from "./footer/footer.component";

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
  styleUrl: "./landing.component.scss",
})
export class LandingComponent {}
