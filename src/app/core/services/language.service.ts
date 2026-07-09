import { Injectable, signal, effect, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Language = 'en' | 'fr' | 'ar';

export const LANGUAGES = [
  { code: 'en' as Language, label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr' as Language, label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar' as Language, label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  readonly lang = signal<Language>(this.loadLang());

  constructor() {
    effect(() => {
      const l = this.lang();
      this.translate.use(l);
      localStorage.setItem('medicare-lang', l);
      const dir = l === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', l);
    });
  }

  setLang(lang: Language): void {
    this.lang.set(lang);
  }

  get currentDir(): 'ltr' | 'rtl' {
    return this.lang() === 'ar' ? 'rtl' : 'ltr';
  }

  private loadLang(): Language {
    return (localStorage.getItem('medicare-lang') as Language) ?? 'fr';
  }
}
