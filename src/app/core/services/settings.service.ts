import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  readonly marginPercent    = signal(20);
  readonly promotionPercent = signal(20);

  constructor() { this.load(); }

  private async load(): Promise<void> {
    try {
      const res: any = await this.http.get(`${this.api}/admin/settings`).toPromise();
      if (res?.margin != null) this.marginPercent.set(+res.margin);
      if (res?.promotion != null) this.promotionPercent.set(+res.promotion);
    } catch { /* not admin, ignore */ }
  }

  async save(margin: number, promotion: number): Promise<void> {
    await this.http.patch(`${this.api}/admin/settings`, { margin, promotion }).toPromise();
    this.marginPercent.set(margin);
    this.promotionPercent.set(promotion);
  }
}
