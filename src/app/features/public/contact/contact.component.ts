import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ContactService } from '../../../core/services/contact.service';
import { ContactRequest } from '../../../core/models/contact.model';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        <!-- Left — Info -->
        <div>
          <h1 class="text-4xl font-extrabold mb-4" style="color: var(--text-primary)">{{ 'CONTACT.TITLE' | translate }}</h1>
          <p class="text-lg leading-relaxed mb-8" style="color: var(--text-secondary)">{{ 'CONTACT.SUBTITLE' | translate }}</p>

          <div class="space-y-4">
            @for (info of contactInfos; track info.icon) {
              <div class="flex items-center gap-4 card p-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style="background: var(--primary-light); color: var(--primary)">
                  <span class="text-xl">{{ info.icon }}</span>
                </div>
                <div>
                  <div class="font-semibold text-sm" style="color: var(--text-primary)">{{ info.label | translate }}</div>
                  <div class="text-sm" style="color: var(--text-secondary)">{{ info.value }}</div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Right — Form -->
        <div class="card p-8">
          @if (success()) {
            <div class="text-center py-8">
              <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl" style="background: #d1fae5">✅</div>
              <h3 class="text-xl font-bold mb-2" style="color: var(--text-primary)">{{ 'CONTACT.SUCCESS_TITLE' | translate }}</h3>
              <p class="mb-6" style="color: var(--text-secondary)">{{ 'CONTACT.SUCCESS_MESSAGE' | translate }}</p>
              <button (click)="success.set(false)" class="btn-secondary">{{ 'CONTACT.SEND_ANOTHER' | translate }}</button>
            </div>
          } @else {
            <h2 class="text-xl font-bold mb-6" style="color: var(--text-primary)">{{ 'CONTACT.FORM_TITLE' | translate }}</h2>

            <form (ngSubmit)="submit()" #f="ngForm" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="form-field">
                  <label class="form-label">{{ 'CONTACT.FIRST_NAME' | translate }} *</label>
                  <input type="text" [(ngModel)]="form.first_name" name="first_name" required class="form-input" />
                </div>
                <div class="form-field">
                  <label class="form-label">{{ 'CONTACT.LAST_NAME' | translate }} *</label>
                  <input type="text" [(ngModel)]="form.last_name" name="last_name" required class="form-input" />
                </div>
              </div>

              <div class="form-field">
                <label class="form-label">{{ 'CONTACT.PHONE' | translate }} *</label>
                <input type="tel" [(ngModel)]="form.phone" name="phone" required class="form-input" />
              </div>

              <div class="form-field">
                <label class="form-label">{{ 'CONTACT.EMAIL' | translate }} *</label>
                <input type="email" [(ngModel)]="form.email" name="email" required class="form-input" />
              </div>

              <div class="form-field">
                <label class="form-label">{{ 'CONTACT.PRODUCT_REQUESTED' | translate }}</label>
                <input type="text" [(ngModel)]="form.product_requested" name="product_requested" class="form-input" [placeholder]="productName() || ''" />
              </div>

              <div class="form-field">
                <label class="form-label">{{ 'CONTACT.MESSAGE' | translate }} *</label>
                <textarea
                  [(ngModel)]="form.message"
                  name="message"
                  required
                  rows="4"
                  class="form-input resize-none"
                ></textarea>
              </div>

              @if (error()) {
                <p class="text-sm text-red-500">{{ error() }}</p>
              }

              <button
                type="submit"
                [disabled]="submitting() || f.invalid"
                class="btn-primary w-full justify-center py-3"
                [class.opacity-60]="submitting() || f.invalid"
              >
                @if (submitting()) {
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {{ 'CONTACT.SENDING' | translate }}
                } @else {
                  {{ 'CONTACT.SUBMIT' | translate }}
                }
              </button>
            </form>
          }
        </div>
      </div>
    </div>
  `,
})
export class ContactComponent implements OnInit {
  private contactSvc = inject(ContactService);
  private route = inject(ActivatedRoute);

  protected success = signal(false);
  protected submitting = signal(false);
  protected error = signal('');
  protected productName = signal('');

  protected form: Omit<ContactRequest, 'id' | 'status' | 'created_at'> = {
    first_name: '', last_name: '', phone: '', email: '', message: '', product_requested: '',
  };

  protected contactInfos = [
    { icon: '📧', label: 'CONTACT.INFO.EMAIL', value: 'Ghofraninaya5@gmail.com' },
    { icon: '📞', label: 'CONTACT.INFO.PHONE', value: '+216 54 547 403' },
    { icon: '📍', label: 'CONTACT.INFO.ADDRESS', value: 'Sousse, Tunisia  ||   Nabeul, Tunisia' },
    { icon: '🕐', label: 'CONTACT.INFO.HOURS', value: 'Dim–Jeu, 8:00–18:00' },
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      if (p['product']) {
        this.form.product_requested = p['product'];
        this.productName.set(p['name'] ?? p['product']);
      }
    });
  }

  async submit(): Promise<void> {
    this.submitting.set(true);
    this.error.set('');
    try {
      await this.contactSvc.submit(this.form);
      this.success.set(true);
      this.form = { first_name: '', last_name: '', phone: '', email: '', message: '', product_requested: '' };
    } catch (e) {
      this.error.set('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      this.submitting.set(false);
    }
  }
}
