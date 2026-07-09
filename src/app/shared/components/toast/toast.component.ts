import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      @for (toast of svc.toasts(); track toast.id) {
        <div
          class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto"
          [style]="getStyle(toast.type)"
        >
          <span class="text-lg shrink-0">{{ getIcon(toast.type) }}</span>
          <span>{{ toast.message }}</span>
          <button
            class="ml-2 opacity-60 hover:opacity-100 shrink-0"
            (click)="svc.remove(toast.id)"
          >✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  protected svc = inject(ToastService);

  getIcon(type: string): string {
    return type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  }

  getStyle(type: string): string {
    const styles: Record<string, string> = {
      success: 'background:#dcfce7; color:#15803d; border:1px solid #86efac',
      error:   'background:#fee2e2; color:#dc2626; border:1px solid #fca5a5',
      info:    'background:#f1f5f9; color:#334155; border:1px solid #cbd5e1',
    };
    return styles[type] ?? styles['info'];
  }
}
