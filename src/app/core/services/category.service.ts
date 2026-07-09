import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category } from '../models/category.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll(): Observable<Category[]> {
    return this.http.get<any>(`${this.api}/categories`).pipe(map(r => r.categories));
  }

  async getById(id: string | number): Promise<Category | null> {
    const res: any = await this.http.get(`${this.api}/categories/${id}`).toPromise();
    return res?.category ?? null;
  }

  async add(data: Omit<Category, 'id' | 'created_at'>): Promise<string> {
    const res: any = await this.http.post(`${this.api}/admin/categories`, { category: data }).toPromise();
    return res.category.id;
  }

  async update(id: string | number, data: Partial<Category>): Promise<void> {
    await this.http.patch(`${this.api}/admin/categories/${id}`, { category: data }).toPromise();
  }

  async delete(id: string | number): Promise<void> {
    await this.http.delete(`${this.api}/admin/categories/${id}`).toPromise();
  }
}
