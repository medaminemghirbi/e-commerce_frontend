import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll(params?: { q?: string; category_id?: string | number; page?: number; per?: number }): Observable<{ products: Product[]; meta: any }> {
    return this.http.get<any>(`${this.api}/products`, { params: params as any });
  }

  getAllPublic(): Observable<Product[]> {
    return this.http.get<any>(`${this.api}/products`, { params: { per: 9999 } }).pipe(map(r => r.products ?? []));
  }

  getAllAdmin(): Observable<Product[]> {
    return this.http.get<any>(`${this.api}/admin/products`, { params: { per: 9999 } }).pipe(map(r => r.products ?? []));
  }

  getAdminPaginated(params: {
    page?: number; per?: number;
    q?: string; category_id?: string | number; status?: string;
  }): Observable<{ products: Product[]; meta: { total_count: number; current_page: number; total_pages: number } }> {
    const clean: any = {};
    if (params.page)        clean['page']        = params.page;
    if (params.per)         clean['per']         = params.per;
    if (params.q?.trim())   clean['q']           = params.q.trim();
    if (params.category_id) clean['category_id'] = params.category_id;
    if (params.status)      clean['status']      = params.status;
    return this.http.get<any>(`${this.api}/admin/products`, { params: clean });
  }

  getFeatured(): Observable<Product[]> {
    return this.http.get<any>(`${this.api}/home`).pipe(map(r => r.featured_products));
  }

  getByCategory(categoryId: string): Observable<Product[]> {
    return this.http.get<any>(`${this.api}/products`, { params: { category_id: categoryId } }).pipe(map(r => r.products));
  }

  getByMarque(marqueId: string | number): Observable<Product[]> {
    return this.http.get<any>(`${this.api}/products`, { params: { marque_id: marqueId, per: 9999 } }).pipe(map(r => r.products ?? []));
  }

  async getById(id: string | number): Promise<Product | null> {
    const res: any = await this.http.get(`${this.api}/products/${id}`).toPromise();
    return res?.product ?? null;
  }

  async getLowStock(): Promise<Product[]> {
    const res: any = await this.http.get(`${this.api}/admin/products`, { params: { page: 1, per: 100 } }).toPromise();
    return (res?.products ?? []).filter((p: Product) => (p.stock_quantity ?? 0) <= 2);
  }

  async add(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    await this.http.post(`${this.api}/admin/products`, { product: data }).toPromise();
  }

  async update(id: string | number, data: Partial<Product>): Promise<void> {
    await this.http.patch(`${this.api}/admin/products/${id}`, { product: data }).toPromise();
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res: any = await this.http.post(`${this.api}/admin/uploads`, formData).toPromise();
    return res.url;
  }

  async delete(id: string | number): Promise<void> {
    await this.http.delete(`${this.api}/admin/products/${id}`).toPromise();
  }

  async deleteAll(): Promise<void> {
    await this.http.delete(`${this.api}/admin/products/destroy_all`).toPromise();
  }
}
