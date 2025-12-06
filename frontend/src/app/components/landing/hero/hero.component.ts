import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HlmButtonDirective } from "../../../ui/ui-button-helm/src";

@Component({
  selector: "app-hero",
  standalone: true,
  imports: [RouterLink, HlmButtonDirective],
  templateUrl: "./hero.component.html",
})
export class HeroComponent {}
