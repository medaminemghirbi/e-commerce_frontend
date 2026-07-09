import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center px-4 py-12" style="background: var(--bg)">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <img src="assets/images/logo.png" alt="e-commerce" class="h-36 w-auto mx-auto mb-4" />
          <p class="mt-1 text-sm" style="color: var(--text-secondary)">{{ 'AUTH.LOGIN.SUBTITLE' | translate }}</p>
        </div>

        <div class="card p-8">
          <h2 class="text-xl font-bold mb-6" style="color: var(--text-primary)">{{ 'AUTH.LOGIN.TITLE' | translate }}</h2>

          <form (ngSubmit)="login()" class="space-y-4">
            <div class="form-field">
              <label class="form-label">{{ 'AUTH.EMAIL' | translate }}</label>
              <input type="email" [(ngModel)]="email" name="email" required class="form-input" [placeholder]="'AUTH.EMAIL_PLACEHOLDER' | translate" />
            </div>

            <div class="form-field">
              <label class="form-label">{{ 'AUTH.PASSWORD' | translate }}</label>
              <div class="relative">
                <input
                  [type]="showPwd() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  class="form-input pr-12"
                  [placeholder]="'AUTH.PASSWORD_PLACEHOLDER' | translate"
                />
                <button type="button" (click)="showPwd.set(!showPwd())" class="absolute right-3 top-1/2 -translate-y-1/2" style="color: var(--text-secondary)">
                  @if (showPwd()) {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  } @else {
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  }
                </button>
              </div>
            </div>

            @if (error()) {
              <div class="rounded-xl p-3 text-sm" style="background: #fee2e2; color: #dc2626">{{ error() }}</div>
            }

            <button
              type="submit"
              [disabled]="loading()"
              class="btn-primary w-full justify-center py-3 text-base"
              [class.opacity-60]="loading()"
            >
              @if (loading()) {
                <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              }
              {{ 'AUTH.LOGIN.BUTTON' | translate }}
            </button>
          </form>

          <p class="text-center text-sm mt-4" style="color: var(--text-secondary)">
            {{ 'AUTH.NO_ACCOUNT' | translate }}
            <a routerLink="/auth/register" class="font-semibold" style="color: var(--primary)">{{ 'AUTH.REGISTER.LINK' | translate }}</a>
          </p>
        </div>

        <p class="text-center mt-4 text-xs" style="color: var(--text-secondary)">
          <a routerLink="/" style="color: var(--text-secondary)">← {{ 'AUTH.BACK_HOME' | translate }}</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private authSvc = inject(AuthService);
  private router = inject(Router);

  protected email = '';
  protected password = '';
  protected loading = signal(false);
  protected error = signal('');
  protected showPwd = signal(false);

  constructor() {
    // Redirect already-authenticated users visiting /auth/login
    effect(() => {
      if (!this.authSvc.loading() && !this.loading() && this.authSvc.isLoggedIn()) {
        this.router.navigate([this.authSvc.isAdmin() ? '/admin/dashboard' : '/']);
      }
    });
  }

  async login(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const profile = await this.authSvc.login(this.email, this.password);
      this.router.navigate([profile?.role === 'admin' ? '/admin/dashboard' : '/']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erreur de connexion');
    } finally {
      this.loading.set(false);
    }
  }
}
