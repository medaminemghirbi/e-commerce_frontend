import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { Coupon } from '../../../core/models/coupon.model';

@Component({
  selector: 'app-admin-coupon-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-extrabold" style="color:var(--text-primary)">🎟️ Codes Coupon</h1>
          <p class="text-sm mt-0.5" style="color:var(--text-secondary)">
            Gérez vos coupons de réduction
          </p>
        </div>
        <button (click)="openForm()" class="btn-primary">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nouveau coupon
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="card p-4 text-center">
          <p class="text-2xl font-extrabold" style="color:var(--text-primary)">{{ coupons().length }}</p>
          <p class="text-xs mt-0.5" style="color:var(--text-secondary)">Total</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-extrabold" style="color:#16a34a">{{ activeCount() }}</p>
          <p class="text-xs mt-0.5" style="color:var(--text-secondary)">Actifs</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-extrabold" style="color:#ef4444">{{ expiredCount() }}</p>
          <p class="text-xs mt-0.5" style="color:var(--text-secondary)">Expirés</p>
        </div>
        <div class="card p-4 text-center">
          <p class="text-2xl font-extrabold" style="color:var(--primary)">{{ totalUses() }}</p>
          <p class="text-xs mt-0.5" style="color:var(--text-secondary)">Utilisations</p>
        </div>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        @if (loading()) {
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style="border-color:var(--primary);border-top-color:transparent"></div>
          </div>
        } @else if (coupons().length === 0) {
          <div class="py-20 text-center">
            <div class="text-5xl mb-3">🎟️</div>
            <p class="font-semibold" style="color:var(--text-primary)">Aucun coupon créé</p>
            <p class="text-sm mt-1 mb-5" style="color:var(--text-secondary)">Créez votre premier coupon pour offrir des réductions à vos clients.</p>
            <button (click)="openForm()" class="btn-primary">Créer un coupon</button>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr style="background:var(--bg-secondary);border-bottom:1px solid var(--border)">
                  <th class="px-4 py-3 text-left font-semibold" style="color:var(--text-secondary)">Code</th>
                  <th class="px-4 py-3 text-left font-semibold" style="color:var(--text-secondary)">Type</th>
                  <th class="px-4 py-3 text-left font-semibold" style="color:var(--text-secondary)">Réduction</th>
                  <th class="px-4 py-3 text-left font-semibold" style="color:var(--text-secondary)">Commande min</th>
                  <th class="px-4 py-3 text-left font-semibold" style="color:var(--text-secondary)">Utilisations</th>
                  <th class="px-4 py-3 text-left font-semibold" style="color:var(--text-secondary)">Expiration</th>
                  <th class="px-4 py-3 text-left font-semibold" style="color:var(--text-secondary)">Statut</th>
                  <th class="px-4 py-3 text-center font-semibold" style="color:var(--text-secondary)">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (c of coupons(); track c.id) {
                  <tr class="border-b transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    style="border-color:var(--border)">

                    <!-- Code -->
                    <td class="px-4 py-3">
                      <span class="font-mono font-bold text-sm px-2.5 py-1 rounded-lg"
                        style="background:var(--primary-light);color:var(--primary)">
                        {{ c.code }}
                      </span>
                    </td>

                    <!-- Type -->
                    <td class="px-4 py-3">
                      <span class="badge" [class]="c.discount_type === 'percentage' ? 'badge-primary' : 'badge-success'">
                        {{ c.discount_type === 'percentage' ? '% Pourcentage' : '# Fixe' }}
                      </span>
                    </td>

                    <!-- Valeur -->
                    <td class="px-4 py-3 font-bold" style="color:var(--text-primary)">
                      @if (c.discount_type === 'percentage') {
                        -{{ c.discount_value }}%
                      } @else {
                        -{{ c.discount_value | number:'1.2-2' }} TND
                      }
                    </td>

                    <!-- Min commande -->
                    <td class="px-4 py-3" style="color:var(--text-secondary)">
                      {{ c.min_order_amount ? (c.min_order_amount | number:'1.2-2') + ' TND' : '—' }}
                    </td>

                    <!-- Utilisations -->
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <span style="color:var(--text-primary)">{{ c.uses_count ?? 0 }}</span>
                        @if (c.max_uses) {
                          <span style="color:var(--text-secondary)">/ {{ c.max_uses }}</span>
                          <div class="flex-1 h-1.5 rounded-full overflow-hidden min-w-12" style="background:var(--border)">
                            <div class="h-full rounded-full transition-all"
                              [style.width]="usePct(c) + '%'"
                              [style.background]="usePct(c) >= 100 ? '#ef4444' : 'var(--primary)'"></div>
                          </div>
                        } @else {
                          <span class="text-xs" style="color:var(--text-secondary)">illimité</span>
                        }
                      </div>
                    </td>

                    <!-- Expiration -->
                    <td class="px-4 py-3 text-sm">
                      @if (c.expires_at) {
                        <span [style.color]="isExpired(c.expires_at) ? '#ef4444' : isExpiringSoon(c.expires_at) ? '#f59e0b' : 'var(--text-primary)'">
                          {{ c.expires_at | date:'dd/MM/yyyy' }}
                          @if (isExpired(c.expires_at)) { ❌ }
                          @else if (isExpiringSoon(c.expires_at)) { ⚠️ }
                        </span>
                      } @else {
                        <span style="color:var(--text-secondary)">Sans limite</span>
                      }
                    </td>

                    <!-- Statut toggle -->
                    <td class="px-4 py-3">
                      <button (click)="toggleActive(c)" class="flex items-center gap-1.5 group">
                        <div class="w-9 h-5 rounded-full transition-colors relative"
                          [style.background]="c.is_active ? 'var(--primary)' : 'var(--border)'">
                          <div class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                            [class.left-0.5]="!c.is_active"
                            [class.left-4]="c.is_active"></div>
                        </div>
                        <span class="text-xs font-medium" [style.color]="c.is_active ? 'var(--primary)' : 'var(--text-secondary)'">
                          {{ c.is_active ? 'Actif' : 'Inactif' }}
                        </span>
                      </button>
                    </td>

                    <!-- Actions -->
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-center gap-2">
                        <button (click)="openForm(c)" title="Modifier"
                          class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button (click)="confirmDelete(c)" title="Supprimer"
                          class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50 dark:hover:bg-red-900/20">
                          <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>

    <!-- ── Coupon Form Modal ───────────────────────────────────── -->
    @if (showForm()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.5)" (click)="closeForm()">
        <div class="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style="background:var(--bg-card)" (click)="$event.stopPropagation()">

          <!-- Modal header -->
          <div class="flex items-center justify-between px-6 py-4 border-b" style="border-color:var(--border)">
            <h2 class="text-lg font-bold" style="color:var(--text-primary)">
              {{ editingId() ? 'Modifier le coupon' : 'Nouveau coupon' }}
            </h2>
            <button (click)="closeForm()" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color:var(--text-secondary)">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Form body -->
          <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">

            <!-- Code -->
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color:var(--text-secondary)">Code *</label>
              <div class="flex gap-2">
                <input [(ngModel)]="form.code" placeholder="ex: ETE2025"
                  class="flex-1 input uppercase"
                  style="font-family:monospace;font-weight:700;letter-spacing:0.1em"
                  maxlength="20" />
                <button (click)="generateCode()" type="button"
                  class="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style="background:var(--bg-secondary);color:var(--text-secondary);border:1px solid var(--border)">
                  🎲 Générer
                </button>
              </div>
            </div>

            <!-- Type + Valeur -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color:var(--text-secondary)">Type *</label>
                <select [(ngModel)]="form.discount_type" class="input w-full">
                  <option value="percentage">% Pourcentage</option>
                  <option value="fixed">TND Montant fixe</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color:var(--text-secondary)">Valeur *</label>
                <input [(ngModel)]="form.discount_value" type="number" min="0"
                  [max]="form.discount_type === 'percentage' ? 100 : null"
                  [placeholder]="form.discount_type === 'percentage' ? 'ex: 20' : 'ex: 10'"
                  class="input w-full" />
              </div>
            </div>

            <!-- Aperçu réduction -->
            @if (form.discount_value > 0) {
              <div class="px-4 py-2.5 rounded-xl text-sm font-semibold text-center"
                style="background:var(--primary-light);color:var(--primary)">
                🎉 Réduction :
                @if (form.discount_type === 'percentage') {
                  -{{ form.discount_value }}% sur la commande
                } @else {
                  -{{ form.discount_value | number:'1.2-2' }} TND sur la commande
                }
              </div>
            }

            <!-- Commande min -->
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color:var(--text-secondary)">Commande minimum (optionnel)</label>
              <div class="relative">
                <input [(ngModel)]="form.min_order_amount" type="number" min="0" placeholder="ex: 50"
                  class="input w-full pr-14" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style="color:var(--text-secondary)">TND</span>
              </div>
            </div>

            <!-- Max uses -->
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color:var(--text-secondary)">Nombre d'utilisations max (0 = illimité)</label>
              <input [(ngModel)]="form.max_uses" type="number" min="0" placeholder="0"
                class="input w-full" />
            </div>

            <!-- Expiration -->
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color:var(--text-secondary)">Date d'expiration (optionnel)</label>
              <input [(ngModel)]="form.expires_at" type="date" class="input w-full" />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style="color:var(--text-secondary)">Description interne (optionnel)</label>
              <input [(ngModel)]="form.description" placeholder="ex: Promotion été 2025"
                class="input w-full" />
            </div>

            <!-- Active toggle -->
            <div class="flex items-center justify-between py-2">
              <div>
                <p class="text-sm font-semibold" style="color:var(--text-primary)">Coupon actif</p>
                <p class="text-xs" style="color:var(--text-secondary)">Peut être utilisé dès maintenant</p>
              </div>
              <button (click)="form.is_active = !form.is_active" type="button"
                class="w-12 h-6 rounded-full transition-colors relative"
                [style.background]="form.is_active ? 'var(--primary)' : 'var(--border)'">
                <div class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  [class.left-0.5]="!form.is_active"
                  [class.left-6]="form.is_active"></div>
              </button>
            </div>

            <!-- Error -->
            @if (formError()) {
              <div class="px-4 py-3 rounded-xl text-sm" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
                {{ formError() }}
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="flex gap-3 px-6 py-4 border-t" style="border-color:var(--border)">
            <button (click)="closeForm()" class="btn-secondary flex-1">Annuler</button>
            <button (click)="save()" [disabled]="saving()" class="btn-primary flex-1">
              @if (saving()) {
                <div class="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white"></div>
              } @else {
                {{ editingId() ? 'Enregistrer' : 'Créer le coupon' }}
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Delete confirm modal ─────────────────────────────── -->
    @if (deletingCoupon()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.5)" (click)="deletingCoupon.set(null)">
        <div class="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style="background:var(--bg-card)" (click)="$event.stopPropagation()">
          <div class="text-4xl text-center mb-3">🗑️</div>
          <h3 class="text-lg font-bold text-center mb-2" style="color:var(--text-primary)">Supprimer ce coupon ?</h3>
          <p class="text-sm text-center mb-5" style="color:var(--text-secondary)">
            Le coupon <strong class="font-mono" style="color:var(--primary)">{{ deletingCoupon()!.code }}</strong> sera définitivement supprimé.
          </p>
          <div class="flex gap-3">
            <button (click)="deletingCoupon.set(null)" class="btn-secondary flex-1">Annuler</button>
            <button (click)="doDelete()" class="btn-danger flex-1">Supprimer</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminCouponListComponent implements OnInit {
  private svc = inject(CouponService);

  protected coupons       = signal<Coupon[]>([]);
  protected loading       = signal(true);
  protected showForm      = signal(false);
  protected saving        = signal(false);
  protected formError     = signal('');
  protected editingId     = signal<string | number | null>(null);
  protected deletingCoupon = signal<Coupon | null>(null);

  protected activeCount  = computed(() => this.coupons().filter(c => c.is_active && !this.isExpired(c.expires_at ?? '')).length);
  protected expiredCount = computed(() => this.coupons().filter(c => c.expires_at && this.isExpired(c.expires_at)).length);
  protected totalUses    = computed(() => this.coupons().reduce((s, c) => s + (c.uses_count ?? 0), 0));

  protected form = {
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_amount: null as number | null,
    max_uses: 0,
    expires_at: '',
    description: '',
    is_active: true,
  };

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next:  cs => { this.coupons.set(cs); this.loading.set(false); },
      error: ()  => { this.loading.set(false); },
    });
  }

  openForm(c?: Coupon): void {
    if (c) {
      this.editingId.set(c.id!);
      this.form = {
        code:              c.code,
        discount_type:     c.discount_type,
        discount_value:    c.discount_value,
        min_order_amount:  c.min_order_amount ?? null,
        max_uses:          c.max_uses ?? 0,
        expires_at:        c.expires_at?.substring(0, 10) ?? '',
        description:       c.description ?? '',
        is_active:         c.is_active ?? true,
      };
    } else {
      this.editingId.set(null);
      this.form = { code: '', discount_type: 'percentage', discount_value: 0, min_order_amount: null, max_uses: 0, expires_at: '', description: '', is_active: true };
    }
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); }

  generateCode(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    this.form.code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  save(): void {
    if (!this.form.code.trim()) { this.formError.set('Le code est obligatoire.'); return; }
    if (!this.form.discount_value || this.form.discount_value <= 0) { this.formError.set('La valeur de réduction doit être > 0.'); return; }

    const payload = {
      code:             this.form.code.trim().toUpperCase(),
      discount_type:    this.form.discount_type,
      discount_value:   this.form.discount_value,
      min_order_amount: this.form.min_order_amount || undefined,
      max_uses:         this.form.max_uses || undefined,
      expires_at:       this.form.expires_at || undefined,
      description:      this.form.description || undefined,
      is_active:        this.form.is_active,
    };

    this.saving.set(true);
    this.formError.set('');

    const req = this.editingId()
      ? this.svc.update(this.editingId()!, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: (e) => {
        this.saving.set(false);
        this.formError.set(e?.error?.message ?? 'Une erreur est survenue.');
      },
    });
  }

  toggleActive(c: Coupon): void {
    this.svc.update(c.id!, { is_active: !c.is_active }).subscribe(() => this.load());
  }

  confirmDelete(c: Coupon): void { this.deletingCoupon.set(c); }

  doDelete(): void {
    const c = this.deletingCoupon();
    if (!c) return;
    this.svc.delete(c.id!).subscribe(() => {
      this.deletingCoupon.set(null);
      this.coupons.set(this.coupons().filter(x => x.id !== c.id));
    });
  }

  usePct(c: Coupon): number {
    if (!c.max_uses) return 0;
    return Math.min(100, Math.round(((c.uses_count ?? 0) / c.max_uses) * 100));
  }

  isExpired(dateStr?: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  }

  isExpiringSoon(dateStr: string): boolean {
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    return days > 0 && days <= 7;
  }
}
