import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardData } from '../../../core/models/dashboard.model';

Chart.register(...registerables);

type Tab = 'overview' | 'stats';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">

      <!-- Header + tabs -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold" style="color: var(--text-primary)">Tableau de bord</h1>
          <p class="text-sm mt-1" style="color: var(--text-secondary)">Vue d'ensemble de votre plateforme</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Tab switcher -->
          <div class="flex rounded-xl p-1 gap-1" style="background: var(--border)">
            <button
              (click)="activeTab.set('overview')"
              class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              [style.background]="activeTab() === 'overview' ? 'var(--bg-card)' : 'transparent'"
              [style.color]="activeTab() === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)'"
              [style.box-shadow]="activeTab() === 'overview' ? '0 1px 3px rgba(0,0,0,.12)' : 'none'"
            >📊 Vue d'ensemble</button>
            <button
              (click)="activeTab.set('stats')"
              class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
              [style.background]="activeTab() === 'stats' ? 'var(--bg-card)' : 'transparent'"
              [style.color]="activeTab() === 'stats' ? 'var(--text-primary)' : 'var(--text-secondary)'"
              [style.box-shadow]="activeTab() === 'stats' ? '0 1px 3px rgba(0,0,0,.12)' : 'none'"
            >📈 Statistiques</button>
          </div>
          <button (click)="load()" class="btn btn-outline text-sm flex items-center gap-2" [disabled]="loading()">
            <span [class.animate-spin]="loading()">↻</span> Actualiser
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <div class="text-center">
            <div class="w-10 h-10 border-4 rounded-full animate-spin mx-auto mb-3"
                 style="border-color: var(--primary); border-top-color: transparent"></div>
            <p class="text-sm" style="color: var(--text-secondary)">Chargement...</p>
          </div>
        </div>
      }

      <!-- Error -->
      @if (!loading() && error()) {
        <div class="card p-8 text-center">
          <div class="text-4xl mb-3">⚠️</div>
          <p class="font-medium" style="color: var(--text-primary)">Erreur de chargement</p>
          <p class="text-sm mt-1 mb-4" style="color: var(--text-secondary)">{{ error() }}</p>
          <button (click)="load()" class="btn btn-primary">Réessayer</button>
        </div>
      }

      <!-- ══════════════════ TAB: OVERVIEW ══════════════════ -->
      @if (!loading() && data() && activeTab() === 'overview') {
        <!-- KPI Row 1 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--text-secondary)">CA Total</span>
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:#d1fae5">💰</span>
            </div>
            <div class="text-2xl font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.total_revenue | currency:'TND':'symbol':'1.2-2' }}</div>
            <div class="text-xs mt-1" style="color: var(--text-secondary)">Commandes livrées</div>
          </div>
          <div class="card p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--text-secondary)">CA ce mois</span>
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:#ecfccb">📅</span>
            </div>
            <div class="text-2xl font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.monthly_revenue | currency:'TND':'symbol':'1.2-2' }}</div>
            <div class="text-xs mt-1" style="color: var(--text-secondary)">Mois en cours</div>
          </div>
          <div class="card p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--text-secondary)">Commandes</span>
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:#ede9fe">📦</span>
            </div>
            <div class="text-2xl font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.total_orders }}</div>
            <div class="text-xs mt-1" style="color: var(--text-secondary)">{{ data()!.kpis.new_orders_today }} aujourd'hui</div>
          </div>
          <div class="card p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--text-secondary)">Clients</span>
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:#fce7f3">👥</span>
            </div>
            <div class="text-2xl font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.total_clients }}</div>
            <div class="text-xs mt-1" style="color: var(--text-secondary)">Inscrits</div>
          </div>
        </div>

        <!-- KPI Row 2 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--text-secondary)">Produits actifs</span>
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:#d1fae5">✅</span>
            </div>
            <div class="text-2xl font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.active_products }}</div>
            <div class="text-xs mt-1" style="color: var(--text-secondary)">/ {{ data()!.kpis.total_products }} total</div>
          </div>
          <div class="card p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--text-secondary)">Stock faible</span>
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:#fef3c7">⚠️</span>
            </div>
            <div class="text-2xl font-extrabold" style="color: #d97706">{{ data()!.kpis.low_stock_count }}</div>
            <div class="text-xs mt-1" style="color: var(--text-secondary)">{{ data()!.kpis.out_of_stock_count }} en rupture</div>
          </div>
          <div class="card p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--text-secondary)">En attente</span>
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:#fee2e2">⏳</span>
            </div>
            <div class="text-2xl font-extrabold" style="color: #dc2626">{{ data()!.kpis.pending_orders }}</div>
            <div class="text-xs mt-1" style="color: var(--text-secondary)">Commandes à traiter</div>
          </div>
          <div class="card p-5">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium uppercase tracking-wide" style="color: var(--text-secondary)">Contacts</span>
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style="background:#ede9fe">📬</span>
            </div>
            <div class="text-2xl font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.contact_requests }}</div>
            <div class="text-xs mt-1" style="color: var(--text-secondary)">{{ data()!.kpis.pending_contacts }} non traités</div>
          </div>
        </div>

        <!-- Orders by status + Revenue bars -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-5">
            <h3 class="font-bold mb-4" style="color: var(--text-primary)">📊 Commandes par statut</h3>
            <div class="space-y-3">
              @for (entry of orderStatusEntries(); track entry.status) {
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium" style="color: var(--text-primary)">{{ statusLabel(entry.status) }}</span>
                    <span style="color: var(--text-secondary)">{{ entry.count }}</span>
                  </div>
                  <div class="h-2 rounded-full overflow-hidden" style="background: var(--border)">
                    <div class="h-full rounded-full transition-all duration-700"
                         [style.width.%]="entry.pct"
                         [style.background]="statusColor(entry.status)"></div>
                  </div>
                </div>
              }
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold mb-4" style="color: var(--text-primary)">📈 CA mensuel</h3>
            <div class="space-y-3">
              @for (m of revenueBars(); track m.month) {
                <div>
                  <div class="flex justify-between text-sm mb-1">
                    <span style="color: var(--text-primary)">{{ m.month }}</span>
                    <span class="font-medium" style="color: var(--text-primary)">{{ m.revenue | currency:'TND':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="h-2 rounded-full overflow-hidden" style="background: var(--border)">
                    <div class="h-full rounded-full transition-all duration-700"
                         [style.width.%]="m.pct"
                         style="background: linear-gradient(90deg, var(--primary), var(--accent))"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Top selling + Top contacted -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold" style="color: var(--text-primary)">🏆 Top ventes</h3>
              <a routerLink="/admin/products" class="text-sm" style="color: var(--primary)">Voir tout</a>
            </div>
            <div class="space-y-3">
              @for (p of data()!.top_selling_products; track p.id; let i = $index) {
                <div class="flex items-center gap-3 p-3 rounded-xl" style="background: var(--bg)">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        [style.background]="rankColor(i)">{{ i + 1 }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate" style="color: var(--text-primary)">{{ p.name }}</div>
                    <div class="text-xs" style="color: var(--text-secondary)">{{ p.quantity_sold }} vendus</div>
                  </div>
                  <div class="text-sm font-bold shrink-0" style="color: var(--primary)">{{ p.revenue | currency:'TND':'symbol':'1.0-0' }}</div>
                </div>
              }
              @empty {
                <p class="text-sm text-center py-4" style="color: var(--text-secondary)">Aucune donnée</p>
              }
            </div>
          </div>
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold" style="color: var(--text-primary)">🔍 Produits les plus demandés</h3>
              <a routerLink="/admin/contacts" class="text-sm" style="color: var(--primary)">Voir tout</a>
            </div>
            <div class="space-y-3">
              @for (p of data()!.top_contacted_products; track p.id; let i = $index) {
                <div class="flex items-center gap-3 p-3 rounded-xl" style="background: var(--bg)">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        [style.background]="rankColor(i)">{{ i + 1 }}</span>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate" style="color: var(--text-primary)">{{ p.name }}</div>
                  </div>
                  <span class="badge badge-primary shrink-0">{{ p.contact_count }} demandes</span>
                </div>
              }
              @empty {
                <p class="text-sm text-center py-4" style="color: var(--text-secondary)">Aucune donnée</p>
              }
            </div>
          </div>
        </div>

        <!-- Low stock + Recent orders -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold" style="color: var(--text-primary)">⚠️ Stock faible</h3>
              <a routerLink="/admin/products" class="text-sm" style="color: var(--primary)">Gérer</a>
            </div>
            <div class="space-y-2">
              @for (p of data()!.low_stock_products; track p.id) {
                <div class="flex items-center justify-between p-3 rounded-xl" style="background: var(--bg)">
                  <span class="text-sm font-medium" style="color: var(--text-primary)">{{ p.name }}</span>
                  <span class="badge" [class]="p.stock_quantity === 0 ? 'badge-danger' : 'badge-warning'">
                    {{ p.stock_quantity === 0 ? 'Rupture' : p.stock_quantity + ' unités' }}
                  </span>
                </div>
              }
              @empty {
                <p class="text-sm text-center py-4" style="color: var(--text-secondary)">Tous les stocks sont OK ✅</p>
              }
            </div>
          </div>
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold" style="color: var(--text-primary)">🛒 Commandes récentes</h3>
              <a routerLink="/admin/orders" class="text-sm" style="color: var(--primary)">Voir tout</a>
            </div>
            <div class="space-y-2">
              @for (o of data()!.recent_orders; track o.id) {
                <div class="flex items-center justify-between p-3 rounded-xl" style="background: var(--bg)">
                  <div class="min-w-0">
                    <div class="text-sm font-medium truncate" style="color: var(--text-primary)">#{{ o.id }} — {{ o.client_name }}</div>
                    <div class="text-xs" style="color: var(--text-secondary)">{{ o.created_at | date:'dd/MM/yyyy' }}</div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="text-sm font-bold" style="color: var(--primary)">{{ o.total | currency:'TND':'symbol':'1.0-0' }}</span>
                    <span class="badge" [class]="orderBadge(o.status)">{{ statusLabel(o.status) }}</span>
                  </div>
                </div>
              }
              @empty {
                <p class="text-sm text-center py-4" style="color: var(--text-secondary)">Aucune commande</p>
              }
            </div>
          </div>
        </div>
      }

      <!-- ══════════════════ TAB: STATISTIQUES ══════════════════ -->
      @if (!loading() && data() && activeTab() === 'stats') {
        <!-- Summary strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="card p-4 flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style="background:#d1fae5">💰</span>
            <div>
              <div class="text-lg font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.total_revenue | currency:'TND':'symbol':'1.0-0' }}</div>
              <div class="text-xs" style="color: var(--text-secondary)">CA total</div>
            </div>
          </div>
          <div class="card p-4 flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style="background:#ecfccb">📦</span>
            <div>
              <div class="text-lg font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.total_orders }}</div>
              <div class="text-xs" style="color: var(--text-secondary)">Commandes</div>
            </div>
          </div>
          <div class="card p-4 flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style="background:#fce7f3">👥</span>
            <div>
              <div class="text-lg font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.total_clients }}</div>
              <div class="text-xs" style="color: var(--text-secondary)">Clients</div>
            </div>
          </div>
          <div class="card p-4 flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style="background:#ede9fe">📬</span>
            <div>
              <div class="text-lg font-extrabold" style="color: var(--text-primary)">{{ data()!.kpis.contact_requests }}</div>
              <div class="text-xs" style="color: var(--text-secondary)">Contacts</div>
            </div>
          </div>
        </div>

        <!-- Row 1: Revenue bar + Orders doughnut -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="card p-5 lg:col-span-2">
            <h3 class="font-bold mb-4" style="color: var(--text-primary)">📈 Chiffre d'affaires par mois</h3>
            <div style="position: relative; height: 260px">
              <canvas id="chart-revenue"></canvas>
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold mb-4" style="color: var(--text-primary)">📊 Statuts des commandes</h3>
            <div style="position: relative; height: 260px">
              <canvas id="chart-status"></canvas>
            </div>
          </div>
        </div>

        <!-- Row 2: Orders per day line + Top selling horizontal bar -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-5">
            <h3 class="font-bold mb-4" style="color: var(--text-primary)">📅 Commandes par jour</h3>
            <div style="position: relative; height: 240px">
              <canvas id="chart-orders-day"></canvas>
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold mb-4" style="color: var(--text-primary)">🏆 Top produits vendus</h3>
            <div style="position: relative; height: 240px">
              <canvas id="chart-top-products"></canvas>
            </div>
          </div>
        </div>

        <!-- Row 3: Top searched + Top viewed -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-5">
            <h3 class="font-bold mb-4" style="color: var(--text-primary)">🔍 Produits les plus demandés</h3>
            <div style="position: relative; height: 240px">
              <canvas id="chart-top-searched"></canvas>
            </div>
          </div>
          <div class="card p-5">
            <h3 class="font-bold mb-4" style="color: var(--text-primary)">👁️ Produits les plus vus</h3>
            <div style="position: relative; height: 240px">
              <canvas id="chart-top-viewed"></canvas>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardSvc = inject(DashboardService);

  protected data      = signal<DashboardData | null>(null);
  protected loading   = signal(true);
  protected error     = signal<string | null>(null);
  protected activeTab = signal<Tab>('overview');

  private charts: Chart[] = [];

  constructor() {
    effect(() => {
      const tab  = this.activeTab();
      const d    = this.data();
      if (tab === 'stats' && d) {
        // defer until the @if block renders the canvases
        setTimeout(() => this.initCharts(d), 0);
      } else {
        this.destroyCharts();
      }
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.destroyCharts();
    this.dashboardSvc.getData().subscribe({
      next: d  => { this.data.set(d); this.loading.set(false); },
      error: e => { this.error.set(e?.error?.message ?? 'Une erreur est survenue'); this.loading.set(false); },
    });
  }

  // ── computed helpers ──────────────────────────────────────────────────────

  protected orderStatusEntries = computed(() => {
    const byStatus = this.data()?.orders_by_status ?? {};
    const total    = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(byStatus).map(([status, count]) => ({
      status, count, pct: (count / total) * 100,
    }));
  });

  protected revenueBars = computed(() => {
    const months = this.data()?.revenue_by_month ?? [];
    const max    = Math.max(...months.map(m => m.revenue), 1);
    return months.map(m => ({ ...m, pct: (m.revenue / max) * 100 }));
  });

  // ── label/color helpers ───────────────────────────────────────────────────

  statusLabel(s: string): string {
    return ({ pending: 'En attente', confirmed: 'Confirmée', delivered: 'Livrée',
              cancelled: 'Annulée', processing: 'En cours', new: 'Nouveau' } as Record<string,string>)[s] ?? s;
  }

  statusColor(s: string): string {
    return ({ pending: '#f59e0b', confirmed: '#008000', delivered: '#10b981',
              cancelled: '#ef4444', processing: '#8b5cf6' } as Record<string,string>)[s] ?? '#6b7280';
  }

  orderBadge(s: string): string {
    return ({ pending: 'badge-warning', confirmed: 'badge-primary',
              delivered: 'badge-success', cancelled: 'badge-danger' } as Record<string,string>)[s] ?? 'badge';
  }

  rankColor(i: number): string {
    return (['#f59e0b', '#9ca3af', '#cd7f32'] as string[])[i] ?? 'var(--primary)';
  }

  // ── Chart.js ──────────────────────────────────────────────────────────────

  private destroyCharts(): void {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private initCharts(d: DashboardData): void {
    this.destroyCharts();

    const gridColor   = 'rgba(0,0,0,0.06)';
    const textColor   = '#6b7280';
    const primaryGrad = '#16a34a';

    // 1. Revenue by month — vertical bar
    const ctxRev = document.getElementById('chart-revenue') as HTMLCanvasElement | null;
    if (ctxRev) {
      this.charts.push(new Chart(ctxRev, {
        type: 'bar',
        data: {
          labels: d.revenue_by_month.map(m => m.month),
          datasets: [{
            label: 'CA (TND)',
            data: d.revenue_by_month.map(m => m.revenue),
            backgroundColor: 'rgba(22,163,74,0.75)',
            borderColor: primaryGrad,
            borderWidth: 2,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          },
        },
      }));
    }

    // 2. Orders by status — doughnut
    const ctxStatus = document.getElementById('chart-status') as HTMLCanvasElement | null;
    if (ctxStatus) {
      const entries = Object.entries(d.orders_by_status);
      this.charts.push(new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: entries.map(([s]) => this.statusLabel(s)),
          datasets: [{
            data: entries.map(([, v]) => v),
            backgroundColor: entries.map(([s]) => this.statusColor(s)),
            borderWidth: 2,
            borderColor: '#fff',
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 }, padding: 12, boxWidth: 12 } },
          },
        },
      }));
    }

    // 3. Orders by day — line
    const ctxDay = document.getElementById('chart-orders-day') as HTMLCanvasElement | null;
    if (ctxDay) {
      this.charts.push(new Chart(ctxDay, {
        type: 'line',
        data: {
          labels: d.orders_by_day.map(o => o.date.slice(5)), // MM-DD
          datasets: [{
            label: 'Commandes',
            data: d.orders_by_day.map(o => o.count),
            borderColor: '#008000',
            backgroundColor: 'rgba(0,128,0,0.1)',
            borderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 }, maxTicksLimit: 10 } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, precision: 0 } },
          },
        },
      }));
    }

    // 4. Top selling products — horizontal bar
    const ctxTop = document.getElementById('chart-top-products') as HTMLCanvasElement | null;
    if (ctxTop) {
      const top = d.top_selling_products.slice(0, 7);
      this.charts.push(new Chart(ctxTop, {
        type: 'bar',
        data: {
          labels: top.map(p => p.name.length > 20 ? p.name.slice(0, 18) + '…' : p.name),
          datasets: [{
            label: 'Qté vendue',
            data: top.map(p => p.quantity_sold),
            backgroundColor: [
              '#f59e0b','#9ca3af','#cd7f32',
              '#10b981','#008000','#8b5cf6','#ef4444',
            ],
            borderRadius: 5,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
            y: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
          },
        },
      }));
    }

    // 5. Top viewed products — horizontal bar
    const ctxViewed = document.getElementById('chart-top-viewed') as HTMLCanvasElement | null;
    if (ctxViewed) {
      const viewed = d.top_viewed_products.slice(0, 8);
      this.charts.push(new Chart(ctxViewed, {
        type: 'bar',
        data: {
          labels: viewed.map(p => p.name.length > 22 ? p.name.slice(0, 20) + '…' : p.name),
          datasets: [{
            label: 'Vues',
            data: viewed.map(p => p.views_count),
            backgroundColor: 'rgba(0,128,0,0.75)',
            borderColor: '#008000',
            borderWidth: 2,
            borderRadius: 5,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => { const v = ctx.parsed.x ?? 0; return ` ${v} vue${v > 1 ? 's' : ''}`; },
              },
            },
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, precision: 0 } },
            y: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
          },
        },
      }));
    }

    // 6. Top contacted/searched products — horizontal bar
    const ctxSearched = document.getElementById('chart-top-searched') as HTMLCanvasElement | null;
    if (ctxSearched) {
      const searched = d.top_contacted_products.slice(0, 8);
      this.charts.push(new Chart(ctxSearched, {
        type: 'bar',
        data: {
          labels: searched.map(p => p.name.length > 22 ? p.name.slice(0, 20) + '…' : p.name),
          datasets: [{
            label: 'Demandes',
            data: searched.map(p => p.contact_count),
            backgroundColor: 'rgba(139,92,246,0.75)',
            borderColor: '#8b5cf6',
            borderWidth: 2,
            borderRadius: 5,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => { const v = ctx.parsed.x ?? 0; return ` ${v} demande${v > 1 ? 's' : ''}`; },
              },
            },
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, precision: 0 } },
            y: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 } } },
          },
        },
      }));
    }
  }
}
