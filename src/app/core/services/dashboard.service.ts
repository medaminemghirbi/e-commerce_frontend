import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardData } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private api  = environment.apiUrl;

  getData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.api}/admin/dashboard`);
  }
}
