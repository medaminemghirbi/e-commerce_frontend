import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Marque } from '../models/marque.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MarqueService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll(): Observable<Marque[]> {
    return this.http.get<any>(`${this.api}/marques`).pipe(map(r => r.marques ?? r));
  }

  async getById(id: string | number): Promise<Marque | null> {
    const res: any = await this.http.get(`${this.api}/marques/${id}`).toPromise();
    return res?.marque ?? null;
  }

  async add(data: Omit<Marque, 'id' | 'created_at'>): Promise<string> {
    const res: any = await this.http.post(`${this.api}/admin/marques`, { marque: data }).toPromise();
    return String(res.marque.id);
  }

  async update(id: string | number, data: Partial<Marque>): Promise<void> {
    await this.http.patch(`${this.api}/admin/marques/${id}`, { marque: data }).toPromise();
  }

  async delete(id: string | number): Promise<void> {
    await this.http.delete(`${this.api}/admin/marques/${id}`).toPromise();
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res: any = await this.http.post(`${this.api}/admin/uploads`, formData).toPromise();
    return res.url;
  }
}
