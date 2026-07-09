import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'translateField', standalone: true, pure: false })
export class TranslateFieldPipe implements PipeTransform {
  private lang = inject(LanguageService);

  transform(obj: Record<string, string> | null | undefined, field: string): string {
    if (!obj) return '';
    const l = this.lang.lang();
    return obj[`${field}_${l}`] ?? obj[`${field}_fr`] ?? obj[`${field}_en`] ?? '';
  }
}
