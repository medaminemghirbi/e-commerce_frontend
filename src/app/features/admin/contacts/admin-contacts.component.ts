import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContactService } from '../../../core/services/contact.service';
import { ContactRequest } from '../../../core/models/contact.model';

@Component({
  selector: 'app-admin-contacts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-extrabold" style="color: var(--text-primary)">{{ 'ADMIN.CONTACTS.TITLE' | translate }}</h1>
        <div class="flex gap-2">
          @for (s of statuses; track s.value) {
            <button
              (click)="filterStatus.set(s.value)"
              class="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
              [style.background]="filterStatus() === s.value ? 'var(--primary)' : 'var(--bg-card)'"
              [style.color]="filterStatus() === s.value ? 'white' : 'var(--text-secondary)'"
              [style.border-color]="filterStatus() === s.value ? 'var(--primary)' : 'var(--border)'"
            >{{ s.label | translate }}</button>
          }
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ 'CONTACT.NAME' | translate }}</th>
              <th>{{ 'CONTACT.EMAIL' | translate }}</th>
              <th>{{ 'CONTACT.PHONE' | translate }}</th>
              <th>{{ 'CONTACT.PRODUCT_REQUESTED' | translate }}</th>
              <th>{{ 'CONTACT.STATUS' | translate }}</th>
              <th>{{ 'ADMIN.ACTIONS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr>
                <td>
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style="background: linear-gradient(135deg, var(--primary), var(--accent))">
                      {{ c.first_name[0] }}{{ c.last_name[0] }}
                    </div>
                    <div>
                      <div class="font-medium" style="color: var(--text-primary)">{{ c.first_name }} {{ c.last_name }}</div>
                    </div>
                  </div>
                </td>
                <td style="color: var(--text-secondary)">{{ c.email }}</td>
                <td style="color: var(--text-secondary)">{{ c.phone }}</td>
                <td>
                  @if (c.product_requested) {
                    <span class="badge badge-primary">{{ c.product_requested }}</span>
                  } @else {
                    <span style="color: var(--text-secondary)">—</span>
                  }
                </td>
                <td>
                  <select
                    [ngModel]="c.status"
                    (ngModelChange)="updateStatus(c, $event)"
                    class="form-input py-1 text-sm w-auto"
                  >
                    <option value="new">{{ 'CONTACT.STATUS_NEW' | translate }}</option>
                    <option value="read">{{ 'CONTACT.STATUS_READ' | translate }}</option>
                    <option value="replied">{{ 'CONTACT.STATUS_REPLIED' | translate }}</option>
                  </select>
                </td>
                <td>
                  <button (click)="viewMessage(c)" class="btn-secondary py-1.5 px-3 text-xs">
                    {{ 'ADMIN.VIEW' | translate }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!filtered().length) {
          <div class="text-center py-12" style="color: var(--text-secondary)">{{ 'ADMIN.CONTACTS.EMPTY' | translate }}</div>
        }
      </div>
    </div>

    <!-- Message modal -->
    @if (selectedContact()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5)">
        <div class="card p-6 w-full max-w-lg">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-lg" style="color: var(--text-primary)">{{ 'CONTACT.MESSAGE' | translate }}</h3>
            <button (click)="selectedContact.set(null)" class="w-8 h-8 flex items-center justify-center rounded-lg" style="background: var(--bg)">✕</button>
          </div>
          <div class="mb-2 text-sm" style="color: var(--text-secondary)">
            <strong>{{ selectedContact()!.first_name }} {{ selectedContact()!.last_name }}</strong> · {{ selectedContact()!.email }}
          </div>
          <div class="p-4 rounded-xl text-sm leading-relaxed" style="background: var(--bg); color: var(--text-primary)">
            {{ selectedContact()!.message }}
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminContactsComponent {
  private contactSvc = inject(ContactService);

  protected contacts = toSignal(this.contactSvc.getAll(), { initialValue: [] as ContactRequest[] });
  protected filterStatus = signal('');
  protected selectedContact = signal<ContactRequest | null>(null);

  protected statuses = [
    { value: '', label: 'CONTACT.ALL' },
    { value: 'new', label: 'CONTACT.STATUS_NEW' },
    { value: 'read', label: 'CONTACT.STATUS_READ' },
    { value: 'replied', label: 'CONTACT.STATUS_REPLIED' },
  ];

  protected filtered = computed(() => {
    const s = this.filterStatus();
    if (!s) return this.contacts();
    return this.contacts().filter(c => c.status === s);
  });

  viewMessage(c: ContactRequest): void {
    this.selectedContact.set(c);
    if (c.status === 'new') this.updateStatus(c, 'read');
  }

  async updateStatus(c: ContactRequest, status: ContactRequest['status']): Promise<void> {
    await this.contactSvc.updateStatus(c.id!, status);
  }
}
