import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContactRequest } from '../models/contact.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getAll(): Observable<ContactRequest[]> {
    return this.http.get<any>(`${this.api}/admin/contact_requests`).pipe(map(r => r.contact_requests));
  }

  getNew(): Observable<ContactRequest[]> {
    return this.getAll().pipe(map(items => items.filter(c => c.status === 'new')));
  }

  async submit(data: Omit<ContactRequest, 'id' | 'status' | 'created_at'>): Promise<void> {
    await this.http.post(`${this.api}/contact_requests`, { contact_request: { ...data, status: 'new' } }).toPromise();
  }

  async updateStatus(id: string | number, status: ContactRequest['status']): Promise<void> {
    await this.http.patch(`${this.api}/admin/contact_requests/${id}`, { status }).toPromise();
  }
}
