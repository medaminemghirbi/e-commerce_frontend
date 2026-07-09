import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Coupon, CouponValidateResponse } from '../models/coupon.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll(): Observable<Coupon[]> {
    return this.http.get<any>(`${this.api}/admin/coupons`).pipe(map(r => r.coupons ?? r));
  }

  getById(id: string | number): Observable<Coupon> {
    return this.http.get<any>(`${this.api}/admin/coupons/${id}`).pipe(map(r => r.coupon ?? r));
  }

  create(data: Omit<Coupon, 'id' | 'created_at' | 'uses_count'>): Observable<Coupon> {
    return this.http.post<any>(`${this.api}/admin/coupons`, { coupon: data }).pipe(map(r => r.coupon ?? r));
  }

  update(id: string | number, data: Partial<Coupon>): Observable<Coupon> {
    return this.http.patch<any>(`${this.api}/admin/coupons/${id}`, { coupon: data }).pipe(map(r => r.coupon ?? r));
  }

  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/coupons/${id}`);
  }

  validate(code: string, order_amount: number): Observable<CouponValidateResponse> {
    return this.http.post<CouponValidateResponse>(`${this.api}/coupons/validate`, { code, order_amount });
  }
}
