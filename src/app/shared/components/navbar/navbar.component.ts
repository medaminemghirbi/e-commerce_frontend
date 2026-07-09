import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, TranslatePipe, ThemeToggleComponent, LanguageSwitcherComponent],
  template: `
    <nav
      class="sticky top-0 z-50 border-b transition-all duration-300"
      style="background: rgba(var(--bg-card-rgb, 255,255,255), 0.9); backdrop-filter: blur(12px); border-color: var(--border)"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2">
            <img src="assets/images/logo.png" alt="e-commerce" class="h-24 w-auto" />
          </a>

          <!-- Desktop nav -->
          <div class="hidden md:flex items-center gap-1">
            @for (link of navLinks; track link.path) {
              <a
                [routerLink]="link.path"
                routerLinkActive="text-[#008000] font-semibold"
                [routerLinkActiveOptions]="{ exact: link.path === '/' }"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                style="color: var(--text-secondary)"
              >{{ link.label | translate }}</a>
            }
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-2">
            <app-language-switcher />
            <app-theme-toggle />

            <!-- Wishlist -->
            <a routerLink="/wishlist" class="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" style="color:var(--text-secondary)" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              @if (wish.count() > 0) {
                <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style="background:var(--danger); font-size:10px">
                  {{ wish.count() }}
                </span>
              }
            </a>

            <!-- Cart -->
            <a routerLink="/cart" class="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" style="color:var(--text-secondary)" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              @if (cart.count() > 0) {
                <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style="background:var(--primary); font-size:10px">
                  {{ cart.count() }}
                </span>
              }
            </a>

            @if (auth.isLoggedIn()) {
              @if (auth.isAdmin()) {
                <a routerLink="/admin" class="btn-primary text-sm py-2 px-4">
                  {{ 'NAV.ADMIN' | translate }}
                </a>
              } @else {
                <a routerLink="/client/orders" class="btn-secondary text-sm py-2 px-4">
                  {{ 'NAV.MY_ORDERS' | translate }}
                </a>
              }
              <button (click)="auth.logout()" class="btn-secondary text-sm py-2 px-4">
                {{ 'NAV.LOGOUT' | translate }}
              </button>
            } @else {
              <a routerLink="/auth/login" class="btn-primary text-sm py-2 px-4">
                {{ 'NAV.LOGIN' | translate }}
              </a>
            }

            <!-- Mobile menu toggle -->
            <button
              class="md:hidden w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-lg"
              (click)="mobileOpen.set(!mobileOpen())"
            >
              <span class="block w-5 h-0.5 rounded-full transition-all" style="background: var(--text-primary)"
                [style.transform]="mobileOpen() ? 'rotate(45deg) translate(2px, 4px)' : ''"></span>
              <span class="block w-5 h-0.5 rounded-full transition-all" style="background: var(--text-primary)"
                [style.opacity]="mobileOpen() ? '0' : '1'"></span>
              <span class="block w-5 h-0.5 rounded-full transition-all" style="background: var(--text-primary)"
                [style.transform]="mobileOpen() ? 'rotate(-45deg) translate(2px, -4px)' : ''"></span>
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        @if (mobileOpen()) {
          <div class="md:hidden py-3 border-t" style="border-color: var(--border)">
            @for (link of navLinks; track link.path) {
              <a
                [routerLink]="link.path"
                routerLinkActive="text-[#008000] font-semibold"
                (click)="mobileOpen.set(false)"
                class="block px-4 py-3 text-sm font-medium rounded-lg"
                style="color: var(--text-secondary)"
              >{{ link.label | translate }}</a>
            }
            <a routerLink="/wishlist" (click)="mobileOpen.set(false)" class="block px-4 py-3 text-sm font-medium" style="color:var(--text-secondary)">
              ❤️ {{ 'NAV.WISHLIST' | translate }}
            </a>
            <a routerLink="/cart" (click)="mobileOpen.set(false)" class="block px-4 py-3 text-sm font-medium" style="color:var(--text-secondary)">
              🛒 {{ 'NAV.CART' | translate }} @if (cart.count() > 0) { ({{ cart.count() }}) }
            </a>
          </div>
        }
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  protected wish = inject(WishlistService);
  protected mobileOpen = signal(false);

  protected navLinks = [
    { path: '/', label: 'NAV.HOME' },
    { path: '/products', label: 'NAV.PRODUCTS' },
    { path: '/contact', label: 'NAV.CONTACT' },
    { path: '/faq', label: 'NAV.FAQ' },
    { path: '/astuces', label: 'NAV.ASTUCES' },
  ];
}
