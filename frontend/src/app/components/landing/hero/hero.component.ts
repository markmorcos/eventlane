import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import { HlmButtonDirective } from "../../../ui/ui-button-helm/src";

@Component({
  selector: "app-hero",
  imports: [RouterLink, HlmButtonDirective, TranslateModule],
  templateUrl: "./hero.component.html",
})
export class HeroComponent {}
