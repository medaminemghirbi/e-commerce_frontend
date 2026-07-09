import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center px-4 py-12" style="background: var(--bg)">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <img src="assets/images/logo.png" alt="MedicareInaya" class="h-36 w-auto mx-auto mb-4" />
        </div>

        <div class="card p-8">
          <h2 class="text-xl font-bold mb-6" style="color: var(--text-primary)">{{ 'AUTH.REGISTER.TITLE' | translate }}</h2>

          <form (ngSubmit)="register()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="form-field">
                <label class="form-label">{{ 'AUTH.FIRST_NAME' | translate }}</label>
                <input type="text" [(ngModel)]="form.first_name" name="first_name" required class="form-input" />
              </div>
              <div class="form-field">
                <label class="form-label">{{ 'AUTH.LAST_NAME' | translate }}</label>
                <input type="text" [(ngModel)]="form.last_name" name="last_name" required class="form-input" />
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">{{ 'AUTH.EMAIL' | translate }}</label>
              <input type="email" [(ngModel)]="form.email" name="email" required class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">{{ 'AUTH.PHONE' | translate }}</label>
              <input type="tel" [(ngModel)]="form.phone" name="phone" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">{{ 'AUTH.PASSWORD' | translate }}</label>
              <input type="password" [(ngModel)]="form.password" name="password" required minlength="6" class="form-input" />
            </div>

            @if (error()) {
              <div class="rounded-xl p-3 text-sm" style="background: #fee2e2; color: #dc2626">{{ error() }}</div>
            }

            <button type="submit" [disabled]="loading()" class="btn-primary w-full justify-center py-3 text-base" [class.opacity-60]="loading()">
              {{ 'AUTH.REGISTER.BUTTON' | translate }}
            </button>
          </form>

          <p class="text-center text-sm mt-4" style="color: var(--text-secondary)">
            {{ 'AUTH.HAS_ACCOUNT' | translate }}
            <a routerLink="/auth/login" class="font-semibold" style="color: var(--primary)">{{ 'AUTH.LOGIN.LINK' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private authSvc = inject(AuthService);
  private router = inject(Router);

  protected form = { first_name: '', last_name: '', email: '', phone: '', password: '' };
  protected loading = signal(false);
  protected error = signal('');

  async register(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.authSvc.register(this.form.email, this.form.password, {
        first_name: this.form.first_name,
        last_name: this.form.last_name,
        phone: this.form.phone,
      });
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erreur d\'inscription');
    } finally {
      this.loading.set(false);
    }
  }
}
