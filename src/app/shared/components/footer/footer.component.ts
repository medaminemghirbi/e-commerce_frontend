import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <footer class="border-t mt-auto" style="background: var(--bg-card); border-color: var(--border)">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2.5 mb-4">
          <a routerLink="/" class="flex items-center gap-2">
            <img src="assets/images/logo.png" alt="MedicareInaya" class="h-36 w-auto" />
          </a>
            </div>
            <p class="text-sm leading-relaxed max-w-xs" style="color: var(--text-secondary)">
              {{ 'FOOTER.DESCRIPTION' | translate }}
            </p>
          </div>

          <!-- Links -->
          <div>
            <h4 class="font-semibold mb-4 text-sm uppercase tracking-wider" style="color: var(--text-primary)">
              {{ 'FOOTER.NAVIGATION' | translate }}
            </h4>
            <ul class="space-y-2">
              @for (link of footerLinks; track link.path) {
                <li>
                  <a [routerLink]="link.path" class="text-sm transition-colors hover:text-[#008000]" style="color: var(--text-secondary)">
                    {{ link.label | translate }}
                  </a>
                </li>
              }
            </ul>
          </div>

          <!-- Contact -->
          <div>
            <h4 class="font-semibold mb-4 text-sm uppercase tracking-wider" style="color: var(--text-primary)">
              {{ 'FOOTER.CONTACT' | translate }}
            </h4>
            <ul class="space-y-2 text-sm" style="color: var(--text-secondary)">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Ghofraninaya5&#64;gmail.com
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                54 547 403
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Tunisie
              </li>
            </ul>
          </div>
        </div>

        <!-- Locations -->
        <div class="mt-10 pt-8 border-t" style="border-color: var(--border)">
          <h4 class="font-semibold mb-4 text-sm uppercase tracking-wider" style="color: var(--text-primary)">
            {{ 'FOOTER.LOCATIONS' | translate }}
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            @for (loc of locations; track loc.city) {
              <div>
                <p class="text-sm font-medium mb-2" style="color: var(--text-secondary)">{{ loc.city }}</p>
                <iframe
                  [src]="loc.embedUrl"
                  class="w-full h-56 sm:h-64 rounded-xl border-0"
                  style="border: 1px solid var(--border)"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  [attr.title]="loc.city"
                ></iframe>
              </div>
            }
          </div>
        </div>

        <div class="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4" style="border-color: var(--border)">
          <p class="text-sm" style="color: var(--text-secondary)">
            © {{ year }} MedicareInaya. {{ 'FOOTER.RIGHTS' | translate }}
          </p>
          <div class="flex items-center gap-4 text-sm" style="color: var(--text-secondary)">
            <a routerLink="/contact" class="hover:text-[#008000] transition-colors">{{ 'FOOTER.CONTACT' | translate }}</a>
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  private sanitizer = inject(DomSanitizer);

  protected year = new Date().getFullYear();
  protected footerLinks = [
    { path: '/', label: 'NAV.HOME' },
    { path: '/products', label: 'NAV.PRODUCTS' },
    { path: '/contact', label: 'NAV.CONTACT' },
  ];

  protected locations: { city: string; embedUrl: SafeResourceUrl }[] = [
    {
      city: 'Sousse',
      embedUrl: this.trustUrl(
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3234.224463809564!2d10.596489600000002!3d35.8434992!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd8b0023d29221%3A0xf0fa3a966d59d55e!2sMedicare%20by%20inaya!5e0!3m2!1sfr!2stn!4v1782915261830!5m2!1sfr!2stn',
      ),
    },
    {
      city: 'Nabeul',
      embedUrl: this.trustUrl(
        'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3209.4481301419614!2d10.715397411569741!3d36.44672508742978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x130299408afa71bf%3A0x162525a741b0c9f9!2sinaya%20Para!5e0!3m2!1sfr!2stn!4v1782915653509!5m2!1sfr!2stn',
      ),
    },
  ];

  private trustUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
