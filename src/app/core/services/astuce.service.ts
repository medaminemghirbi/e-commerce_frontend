import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Astuce } from '../models/astuce.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AstuceService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll(category?: string): Observable<Astuce[]> {
    const params = category ? `?category=${category}` : '';
    return this.http.get<any>(`${this.api}/astuces${params}`).pipe(map(r => r.astuces));
  }

  getById(id: number | string): Observable<Astuce> {
    return this.http.get<any>(`${this.api}/astuces/${id}`).pipe(map(r => r.astuce));
  }

  // Admin
  adminGetAll(): Observable<Astuce[]> {
    return this.http.get<any>(`${this.api}/admin/astuces`).pipe(map(r => r.astuces));
  }

  adminGetById(id: number | string): Observable<Astuce> {
    return this.http.get<any>(`${this.api}/admin/astuces/${id}`).pipe(map(r => r.astuce));
  }

  create(data: Partial<Astuce>): Observable<Astuce> {
    return this.http.post<any>(`${this.api}/admin/astuces`, { astuce: data }).pipe(map(r => r.astuce));
  }

  update(id: number, data: Partial<Astuce>): Observable<Astuce> {
    return this.http.patch<any>(`${this.api}/admin/astuces/${id}`, { astuce: data }).pipe(map(r => r.astuce));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/astuces/${id}`);
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res: any = await this.http.post(`${this.api}/admin/uploads`, formData).toPromise();
    return res.url;
  }
}
