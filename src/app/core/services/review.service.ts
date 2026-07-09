import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Review } from '../models/review.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getPublished(): Observable<Review[]> {
    return this.http.get<any>(`${this.api}/reviews`).pipe(map(r => r.reviews));
  }

  getMyReviews(): Observable<{ order_id: number | string; rating: number; comment: string }[]> {
    return this.http.get<any>(`${this.api}/reviews/mine`).pipe(map(r => r.reviews));
  }

  create(data: { order_id: number | string; rating: number; comment: string }): Observable<Review> {
    return this.http.post<any>(`${this.api}/reviews`, { review: data }).pipe(map(r => r.review));
  }

  // Admin
  getAll(): Observable<Review[]> {
    return this.http.get<any>(`${this.api}/admin/reviews`).pipe(map(r => r.reviews));
  }

  togglePublish(id: number, published: boolean): Observable<Review> {
    return this.http.patch<any>(`${this.api}/admin/reviews/${id}`, { published }).pipe(map(r => r.review));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/admin/reviews/${id}`);
  }
}
