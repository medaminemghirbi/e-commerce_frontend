import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { UserProfile } from '../models/user.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private api    = environment.apiUrl;

  readonly userProfile = signal<UserProfile | null>(null);
  readonly loading     = signal(true);
  readonly isLoggedIn  = computed(() => this.userProfile() !== null);
  readonly isAdmin     = computed(() => this.userProfile()?.role === 'admin');

  // Legacy compat — components that use currentUser()
  readonly currentUser = this.userProfile;

  constructor() {
    this.restoreSession();
  }

  private async restoreSession(): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { this.loading.set(false); return; }
    try {
      const res: any = await this.http.get(`${this.api}/auth/me`).toPromise();
      this.userProfile.set(res.user);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      this.loading.set(false);
    }
  }

  async login(email: string, password: string): Promise<UserProfile | null> {
    const res: any = await this.http.post(`${this.api}/auth/sign_in`, { user: { email, password } }).toPromise();
    localStorage.setItem(TOKEN_KEY, res.token);
    this.userProfile.set(res.user);
    return res.user;
  }

  async register(email: string, password: string, profile: Partial<UserProfile> & { password_confirmation?: string }): Promise<void> {
    const res: any = await this.http.post(`${this.api}/auth/sign_up`, {
      user: {
        email,
        password,
        password_confirmation: profile['password_confirmation'] ?? password,
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        phone: profile.phone ?? '',
      }
    }).toPromise();
    localStorage.setItem(TOKEN_KEY, res.token);
    this.userProfile.set(res.user);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.userProfile.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
