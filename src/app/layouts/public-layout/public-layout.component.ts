import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TranslatePipe, NavbarComponent, FooterComponent],
  template: `
    <div class="flex flex-col min-h-screen">
      <div class="text-center text-xs sm:text-sm font-semibold py-2 px-4" style="background:var(--primary); color:#fff">
        {{ 'ANNOUNCEMENT_BAR' | translate }}
      </div>
      <app-navbar />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
    </div>
  `,
})
export class PublicLayoutComponent {}
