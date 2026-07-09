import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly unreadCount = signal(0);

  getAll(): Observable<any[]> { return of([]); }
  getUnread(): Observable<any[]> { return of([]); }
  async markRead(_id: string): Promise<void> {}
  async markAllRead(): Promise<void> {}
  async delete(_id: string): Promise<void> {}
  async checkProductAlerts(_products: any[]): Promise<void> {}
}
