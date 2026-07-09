import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Subcategory } from '../models/subcategory.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SubcategoryService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll(): Observable<Subcategory[]> {
    return this.http.get<any>(`${this.api}/subcategories`).pipe(map(r => r.subcategories));
  }

  getByCategory(categoryId: string | number): Observable<Subcategory[]> {
    return this.http.get<any>(`${this.api}/subcategories`, { params: { category_id: String(categoryId) } }).pipe(map(r => r.subcategories));
  }

  async getForProduct(_productId: string): Promise<string[]> {
    // subcategory_ids are now included in the product response
    return [];
  }

  async saveForProduct(productId: string | number, subcategoryIds: string[]): Promise<void> {
    await this.http.patch(`${this.api}/admin/products/${productId}`, { product: { subcategory_ids: subcategoryIds } }).toPromise();
  }

  async add(data: Omit<Subcategory, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    await this.http.post(`${this.api}/admin/subcategories`, { subcategory: data }).toPromise();
  }

  async update(id: string | number, data: Partial<Subcategory>): Promise<void> {
    await this.http.patch(`${this.api}/admin/subcategories/${id}`, { subcategory: data }).toPromise();
  }

  async delete(id: string | number): Promise<void> {
    await this.http.delete(`${this.api}/admin/subcategories/${id}`).toPromise();
  }
}
