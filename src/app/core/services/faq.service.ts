import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Faq } from '../models/faq.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FaqService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getGrouped(): Observable<Record<string, Faq[]>> {
    return this.http.get<any>(`${this.api}/faqs`).pipe(map(r => r.faqs));
  }

  getAll(): Observable<Faq[]> {
    return this.http.get<any>(`${this.api}/admin/faqs`).pipe(map(r => r.faqs));
  }

  create(data: Partial<Faq>): Observable<Faq> {
    return this.http.post<any>(`${this.api}/admin/faqs`, { faq: data }).pipe(map(r => r.faq));
  }

  update(id: number, data: Partial<Faq>): Observable<Faq> {
    return this.http.patch<any>(`${this.api}/admin/faqs/${id}`, { faq: data }).pipe(map(r => r.faq));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/faqs/${id}`);
  }
}
