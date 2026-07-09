import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, LANGUAGES, Language } from '../../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <button
        (click)="open.set(!open())"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
        style="color: var(--text-primary)"
      >
        <span>{{ currentLang().flag }}</span>
        <span>{{ currentLang().code.toUpperCase() }}</span>
        <svg class="w-4 h-4 opacity-60 transition-transform" [class.rotate-180]="open()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      @if (open()) {
        <div
          class="absolute top-full mt-1 right-0 rounded-xl overflow-hidden shadow-lg border z-50 min-w-[130px]"
          style="background: var(--bg-card); border-color: var(--border)"
        >
          @for (lang of languages; track lang.code) {
            <button
              (click)="select(lang.code)"
              class="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium transition-colors text-left"
              [class.bg-green-50]="langSvc.lang() === lang.code"
              [class.text-green-700]="langSvc.lang() === lang.code"
              style="color: var(--text-primary)"
              [style.background]="langSvc.lang() === lang.code ? 'var(--primary-light)' : ''"
              [style.color]="langSvc.lang() === lang.code ? 'var(--primary)' : ''"
            >
              <span>{{ lang.flag }}</span>
              <span>{{ lang.label }}</span>
            </button>
          }
        </div>
        <div class="fixed inset-0 z-40" (click)="open.set(false)"></div>
      }
    </div>
  `,
})
export class LanguageSwitcherComponent {
  protected langSvc = inject(LanguageService);
  protected languages = LANGUAGES;
  protected open = signal(false);

  get currentLang() {
    return () => LANGUAGES.find(l => l.code === this.langSvc.lang()) ?? LANGUAGES[0];
  }

  select(code: Language): void {
    this.langSvc.setLang(code);
    this.open.set(false);
  }
}
