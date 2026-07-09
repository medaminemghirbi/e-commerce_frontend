import { Component, output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  template: `
    <div class="relative">
      <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <svg class="w-5 h-5" style="color: var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
      <input
        type="text"
        [(ngModel)]="query"
        (ngModelChange)="onSearch($event)"
        (keydown.enter)="searched.emit(query)"
        [placeholder]="placeholder() || ('SEARCH.PLACEHOLDER' | translate)"
        class="w-full pl-12 pr-4 py-3 rounded-xl text-base outline-none transition-all"
        style="background: var(--bg-card); border: 1.5px solid var(--border); color: var(--text-primary)"
        [style.border-color]="focused ? 'var(--primary)' : ''"
        [style.box-shadow]="focused ? '0 0 0 3px rgba(14,165,233,0.15)' : ''"
        (focus)="focused = true"
        (blur)="focused = false"
      />
      @if (query) {
        <button
          (click)="clear()"
          class="absolute inset-y-0 right-4 flex items-center"
          style="color: var(--text-secondary)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      }
    </div>
  `,
})
export class SearchBarComponent {
  placeholder = input<string>('');
  searched = output<string>();
  changed = output<string>();

  protected query = '';
  protected focused = false;

  onSearch(val: string): void {
    this.changed.emit(val);
  }

  clear(): void {
    this.query = '';
    this.changed.emit('');
  }
}
