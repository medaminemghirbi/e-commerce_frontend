import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SliderImage } from '../models/slider.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SliderService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getActive(): Observable<SliderImage[]> {
    return this.http.get<any>(`${this.api}/slider_images`).pipe(map(r => r.slider_images));
  }

  getAll(): Observable<SliderImage[]> {
    return this.http.get<any>(`${this.api}/admin/slider_images`).pipe(map(r => r.slider_images));
  }

  async add(data: Omit<SliderImage, 'id' | 'created_at'>): Promise<void> {
    await this.http.post(`${this.api}/admin/slider_images`, { slider_image: data }).toPromise();
  }

  async update(id: string | number, data: Partial<SliderImage>): Promise<void> {
    await this.http.patch(`${this.api}/admin/slider_images/${id}`, { slider_image: data }).toPromise();
  }

  async delete(id: string | number, _imageUrl: string): Promise<void> {
    await this.http.delete(`${this.api}/admin/slider_images/${id}`).toPromise();
  }

  async toggleActive(id: string | number): Promise<void> {
    await this.http.patch(`${this.api}/admin/slider_images/${id}/toggle_active`, {}).toPromise();
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res: any = await this.http.post(`${this.api}/admin/uploads`, formData).toPromise();
    return res.url;
  }
}
