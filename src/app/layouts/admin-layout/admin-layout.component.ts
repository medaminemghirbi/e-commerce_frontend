import { Component, inject, signal, viewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { NgProgressbar } from 'ngx-progressbar';
import { NgProgressRouter } from 'ngx-progressbar/router';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { LanguageSwitcherComponent } from '../../shared/components/language-switcher/language-switcher.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { AuthService } from '../../core/services/auth.service';
import { ProgressService } from '../../core/services/progress.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, RouterLinkActive, TranslatePipe, NgProgressbar, NgProgressRouter, ThemeToggleComponent, LanguageSwitcherComponent, ToastComponent],
  template: `
    <ng-progress #bar ngProgressRouter [speed]="300" [trickleSpeed]="200" [spinner]="false" style="--ng-progress-color:#16a34a" />
    <div class="flex h-screen overflow-hidden" style="background: var(--bg)">

      <!-- Sidebar -->
      <aside
        class="flex flex-col border-r transition-all duration-300 shrink-0"
        [class.w-64]="sidebarOpen()"
        [class.w-16]="!sidebarOpen()"
        style="background: var(--bg-card); border-color: var(--border)"
      >
        <!-- Logo -->
        <div class="flex items-center gap-3 h-16 px-4 border-b" style="border-color: var(--border)">
          <img src="assets/images/logo.png" alt="MedicareInaya" class="h-16 w-auto shrink-0" />
          @if (sidebarOpen()) {
            <span class="text-base font-bold" style="color: var(--text-primary)">
              Medicare<span style="color: var(--primary)">Inaya</span>
            </span>
          }
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto py-4 px-2">
          @for (link of navLinks; track link.path) {
            <a
              [routerLink]="link.path"
              [routerLinkActiveOptions]="{ exact: link.exact ?? false }"
              routerLinkActive="active"
              class="sidebar-link mb-1"
              [class.justify-center]="!sidebarOpen()"
              [attr.title]="!sidebarOpen() ? (link.label | translate) : null"
            >
              <span class="shrink-0 text-lg leading-none">{{ link.emoji }}</span>
              @if (sidebarOpen()) {
                <span>{{ link.label | translate }}</span>
              }
            </a>
          }
        </nav>

        <!-- Bottom -->
        <div class="p-3 border-t" style="border-color: var(--border)">
          <button
            (click)="auth.logout()"
            class="sidebar-link w-full"
            [class.justify-center]="!sidebarOpen()"
          >
            <span class="shrink-0 text-lg leading-none">🚪</span>
            @if (sidebarOpen()) {
              <span>{{ 'NAV.LOGOUT' | translate }}</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Topbar -->
        <header
          class="h-16 flex items-center justify-between px-6 border-b shrink-0"
          style="background: var(--bg-card); border-color: var(--border)"
        >
          <div class="flex items-center gap-3">
            <button
              (click)="sidebarOpen.set(!sidebarOpen())"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <svg class="w-5 h-5" style="color: var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <span class="font-semibold text-base" style="color: var(--text-primary)">{{ 'ADMIN.TITLE' | translate }}</span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Notifications -->
            <a routerLink="/admin/notifications" class="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
              <svg class="w-5 h-5" style="color: var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span class="notif-dot"></span>
            </a>

            <app-language-switcher />
            <app-theme-toggle />

            <!-- Avatar + dropdown -->
            <div class="relative">
              <button
                (click)="avatarMenu.set(!avatarMenu())"
                class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold focus:outline-none"
                style="background: linear-gradient(135deg, var(--primary), var(--accent))"
              >
                {{ initials() }}
              </button>

              @if (avatarMenu()) {
                <!-- Backdrop -->
                <div class="fixed inset-0 z-40" (click)="avatarMenu.set(false)"></div>
                <!-- Menu -->
                <div class="absolute right-0 top-11 z-50 w-52 rounded-2xl shadow-xl border py-2"
                  style="background:var(--bg-card);border-color:var(--border)">
                  <!-- User info -->
                  <div class="px-4 py-3 border-b" style="border-color:var(--border)">
                    <p class="text-sm font-semibold" style="color:var(--text-primary)">
                      {{ auth.userProfile()?.first_name }} {{ auth.userProfile()?.last_name }}
                    </p>
                    <p class="text-xs truncate" style="color:var(--text-secondary)">
                      {{ auth.userProfile()?.email }}
                    </p>
                  </div>
                  <!-- Items -->
                  <a routerLink="/admin/settings" (click)="avatarMenu.set(false)"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    style="color:var(--text-primary)">
                    <span>⚙️</span> Paramètres
                  </a>
                  <div class="border-t my-1" style="border-color:var(--border)"></div>
                  <button (click)="auth.logout(); avatarMenu.set(false)"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    style="color:#dc2626">
                    <span>🚪</span> Déconnexion
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Content -->
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast />
  `,
})
export class AdminLayoutComponent {
  protected auth     = inject(AuthService);
  private   progress = inject(ProgressService);
  protected sidebarOpen = signal(true);
  protected avatarMenu  = signal(false);

  private bar = viewChild<NgProgressbar>('bar');

  constructor() {
    // Forward ProgressService state (data loading in sub-pages) to the shared bar
    effect(() => {
      const ref = this.bar()?.progressRef;
      if (!ref) return;
      if (this.progress.active()) ref.start();
      else ref.complete();
    });
  }

  protected initials() {
    const p = this.auth.userProfile();
    if (!p) return 'A';
    return `${p.first_name[0] ?? ''}${p.last_name[0] ?? ''}`.toUpperCase();
  }

  protected navLinks = [
    { path: '/admin/dashboard', exact: true, label: 'ADMIN.NAV.DASHBOARD',    emoji: '📊' },
    { path: '/admin/products',               label: 'ADMIN.NAV.PRODUCTS',     emoji: '💊' },
    { path: '/admin/categories',             label: 'ADMIN.NAV.CATEGORIES',   emoji: '🏷️' },
    { path: '/admin/marques',                label: 'ADMIN.NAV.MARQUES',      emoji: '🎯' },
    { path: '/admin/orders',                 label: 'ADMIN.NAV.ORDERS',       emoji: '📦' },
    { path: '/admin/coupons',               label: 'ADMIN.NAV.COUPONS',      emoji: '🎟️' },
    { path: '/admin/contacts',               label: 'ADMIN.NAV.CONTACTS',     emoji: '📨' },
    { path: '/admin/notifications',          label: 'ADMIN.NAV.NOTIFICATIONS',emoji: '🔔' },
    { path: '/admin/faqs',                   label: 'ADMIN.NAV.FAQS',         emoji: '❓' },
    { path: '/admin/reviews',                label: 'ADMIN.NAV.REVIEWS',      emoji: '⭐' },
    { path: '/admin/astuces',               label: 'ADMIN.NAV.ASTUCES',      emoji: '💡' },
  ];
}
