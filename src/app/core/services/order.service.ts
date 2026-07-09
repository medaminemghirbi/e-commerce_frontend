import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Order } from '../models/order.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  async create(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const res: any = await this.http.post(`${this.api}/orders`, { order }).toPromise();
    return String(res.order.id);
  }

  getByUser(_userId: number | string): Observable<Order[]> {
    return this.http.get<any>(`${this.api}/orders`).pipe(map(r => r.orders));
  }

  getAll(): Observable<Order[]> {
    return this.http.get<any>(`${this.api}/admin/orders`).pipe(map(r => r.orders));
  }

  async getById(id: string | number): Promise<Order | null> {
    const res: any = await this.http.get(`${this.api}/admin/orders/${id}`).toPromise();
    return res?.order ?? null;
  }

  async updateStatus(id: string | number, status: Order['status']): Promise<void> {
    await this.http.patch(`${this.api}/admin/orders/${id}/update_status`, { status }).toPromise();
  }

  async delete(id: string | number): Promise<void> {
    await this.http.delete(`${this.api}/admin/orders/${id}`).toPromise();
  }
}
