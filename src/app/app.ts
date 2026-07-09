import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App implements OnInit {
  private theme = inject(ThemeService);
  private lang = inject(LanguageService);

  ngOnInit(): void {
    // Services initialize via their constructors (effect-based)
  }
}
