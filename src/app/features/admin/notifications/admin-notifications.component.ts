import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  low_stock:       { icon: '⚠️', color: '#fef3c7' },
  near_expiration: { icon: '📅', color: '#fee2e2' },
  promotion:       { icon: '🎉', color: '#d1fae5' },
  contact_request: { icon: '📬', color: 'var(--primary-light)' },
};

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-extrabold" style="color: var(--text-primary)">{{ 'ADMIN.NOTIFICATIONS.TITLE' | translate }}</h1>
        @if (unread().length) {
          <button (click)="markAllRead()" class="btn-secondary text-sm">
            {{ 'ADMIN.NOTIFICATIONS.MARK_ALL_READ' | translate }}
          </button>
        }
      </div>

      @if (notifications().length) {
        <div class="space-y-3">
          @for (n of notifications(); track n.id) {
            <div
              class="card p-4 flex items-start gap-4"
              [style.opacity]="n.read ? '0.6' : '1'"
            >
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                [style.background]="typeConfig(n.type).color">
                {{ typeConfig(n.type).icon }}
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-0.5">
                  <h3 class="font-bold text-sm" style="color: var(--text-primary)">{{ n.title }}</h3>
                  @if (!n.read) {
                    <span class="w-2 h-2 rounded-full" style="background: var(--primary)"></span>
                  }
                </div>
                <p class="text-sm" style="color: var(--text-secondary)">{{ n.message }}</p>
              </div>
              <div class="flex gap-2">
                @if (!n.read) {
                  <button (click)="markRead(n)" class="btn-secondary py-1 px-3 text-xs">
                    {{ 'ADMIN.NOTIFICATIONS.MARK_READ' | translate }}
                  </button>
                }
                <button (click)="delete(n)" class="px-3 py-1 rounded-lg text-xs font-medium" style="background: #fee2e2; color: #dc2626">
                  {{ 'ADMIN.DELETE' | translate }}
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="card p-16 text-center">
          <div class="text-4xl mb-4">🔔</div>
          <p style="color: var(--text-secondary)">{{ 'ADMIN.NOTIFICATIONS.EMPTY' | translate }}</p>
        </div>
      }
    </div>
  `,
})
export class AdminNotificationsComponent {
  private notifSvc = inject(NotificationService);
  protected notifications = toSignal(this.notifSvc.getAll(), { initialValue: [] as AppNotification[] });

  protected unread() {
    return this.notifications().filter(n => !n.read);
  }

  typeConfig(type: string) {
    return TYPE_CONFIG[type] ?? { icon: '🔔', color: 'var(--primary-light)' };
  }

  async markRead(n: AppNotification): Promise<void> {
    await this.notifSvc.markRead(n.id!);
  }

  async markAllRead(): Promise<void> {
    await this.notifSvc.markAllRead();
  }

  async delete(n: AppNotification): Promise<void> {
    await this.notifSvc.delete(n.id!);
  }
}
