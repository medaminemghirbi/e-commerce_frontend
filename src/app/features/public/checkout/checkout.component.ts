import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CartService }  from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService }  from '../../../core/services/auth.service';

const WILAYAS = [
  'Tunis','Ariana','Ben Arous','Manouba','Nabeul','Zaghouan','Bizerte',
  'Béja','Jendouba','Kef','Siliana','Sousse','Monastir','Mahdia',
  'Sfax','Kairouan','Kasserine','Sidi Bouzid','Gabès','Medenine',
  'Tataouine','Gafsa','Tozeur','Kébili',
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-10">

      <!-- ── Header ── -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold" style="color:var(--text-primary)">
          📦 {{ 'CHECKOUT.TITLE' | translate }}
        </h1>
        @if (!loggedIn()) {
          <p class="mt-2 text-sm" style="color:var(--text-secondary)">
            Vous commandez en tant qu'invité ·
            <a routerLink="/auth/login" [queryParams]="{next:'/checkout'}"
              class="font-semibold" style="color:var(--primary)">
              Se connecter
            </a>
            pour suivre vos commandes
          </p>
        }
      </div>

      <!-- ── SUCCESS ── -->
      @if (success()) {
        <div class="card p-12 text-center max-w-lg mx-auto">
          <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style="background:linear-gradient(135deg,#dcfce7,#bbf7d0)">
            <svg class="w-10 h-10" style="color:#16a34a" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h2 class="text-2xl font-extrabold mb-2" style="color:var(--text-primary)">
            {{ 'CHECKOUT.SUCCESS_TITLE' | translate }}
          </h2>
          <p class="text-sm mb-4" style="color:var(--text-secondary)">
            {{ 'CHECKOUT.SUCCESS_MSG' | translate }}
          </p>

          <!-- Order reference -->
          <div class="rounded-2xl p-4 mb-6" style="background:var(--bg-secondary,var(--bg));border:1.5px dashed var(--border)">
            <p class="text-xs font-semibold mb-1" style="color:var(--text-secondary)">Référence de commande</p>
            <p class="text-lg font-mono font-extrabold tracking-wide" style="color:var(--primary)">
              {{ orderId() }}
            </p>
          </div>

          @if (!loggedIn()) {
            <!-- Guest: save reference message -->
            <div class="rounded-xl p-3 mb-5 text-left text-sm" style="background:#fef9c3;border:1px solid #fef08a">
              <p class="font-semibold" style="color:#854d0e">⚠️ Conservez cette référence !</p>
              <p style="color:#92400e" class="mt-0.5">
                En tant qu'invité, notez ce numéro pour suivre votre commande. Vous pouvez aussi
                <a routerLink="/auth/register" class="underline font-semibold">créer un compte</a>
                pour suivre vos commandes facilement.
              </p>
            </div>
            <div class="flex flex-col gap-3">
              <button (click)="copyRef()" class="btn-secondary w-full justify-center">
                📋 Copier la référence
              </button>
              <a routerLink="/products" class="btn-primary w-full justify-center">
                Continuer les achats
              </a>
            </div>
          } @else {
            <div class="flex gap-3 justify-center">
              <a routerLink="/client/orders" class="btn-primary">{{ 'CHECKOUT.MY_ORDERS' | translate }}</a>
              <a routerLink="/products" class="btn-secondary">{{ 'CART.BROWSE' | translate }}</a>
            </div>
          }
        </div>

      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <!-- ── FORM ── -->
          <div class="lg:col-span-2 space-y-5">

            <!-- Guest info banner -->
            @if (!loggedIn()) {
              <div class="rounded-2xl p-4 flex items-start gap-3"
                style="background:var(--primary-light);border:1px solid rgba(14,165,233,.2)">
                <span class="text-xl shrink-0">👤</span>
                <div class="text-sm">
                  <p class="font-bold mb-0.5" style="color:var(--primary)">Commande invité</p>
                  <p style="color:var(--text-secondary)">
                    Remplissez vos informations ci-dessous. Votre commande sera préparée et livrée à l'adresse indiquée.
                  </p>
                </div>
              </div>
            }

            <div class="card p-6">
              <h2 class="text-base font-bold mb-5 flex items-center gap-2" style="color:var(--text-primary)">
                <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style="background:var(--primary)">1</span>
                {{ 'CHECKOUT.DELIVERY_INFO' | translate }}
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="form-field">
                  <label class="form-label">{{ 'CHECKOUT.FULL_NAME' | translate }} *</label>
                  <input [(ngModel)]="form.full_name" class="form-input"
                    placeholder="ex: Mohamed Ali" />
                </div>
                <div class="form-field">
                  <label class="form-label">{{ 'CHECKOUT.PHONE' | translate }} *</label>
                  <input [(ngModel)]="form.phone" type="tel" class="form-input"
                    placeholder="+216 XX XXX XXX" />
                </div>

                <!-- Email — visible for guests, read-only for logged-in -->
                @if (!loggedIn()) {
                  <div class="form-field sm:col-span-2">
                    <label class="form-label">Adresse e-mail *</label>
                    <input [(ngModel)]="form.email" type="email" class="form-input"
                      placeholder="votre@email.com" />
                    <p class="text-xs mt-1" style="color:var(--text-secondary)">
                      Utilisée uniquement pour confirmer votre commande
                    </p>
                  </div>
                } @else {
                  <div class="form-field sm:col-span-2">
                    <label class="form-label">Adresse e-mail</label>
                    <input [value]="userEmail" class="form-input" readonly
                      style="background:var(--bg-secondary,var(--bg));cursor:not-allowed;color:var(--text-secondary)" />
                  </div>
                }

                <div class="form-field sm:col-span-2">
                  <label class="form-label">{{ 'CHECKOUT.ADDRESS' | translate }} *</label>
                  <input [(ngModel)]="form.address" class="form-input"
                    placeholder="Rue, numéro, immeuble..." />
                </div>
                <div class="form-field">
                  <label class="form-label">{{ 'CHECKOUT.CITY' | translate }} *</label>
                  <input [(ngModel)]="form.city" class="form-input"
                    placeholder="ex: Tunis" />
                </div>
                <div class="form-field">
                  <label class="form-label">{{ 'CHECKOUT.WILAYA' | translate }} *</label>
                  <select [(ngModel)]="form.wilaya" class="form-input">
                    <option value="">— {{ 'CHECKOUT.SELECT_WILAYA' | translate }} —</option>
                    @for (w of wilayas; track w) {
                      <option [value]="w">{{ w }}</option>
                    }
                  </select>
                </div>
                <div class="form-field sm:col-span-2">
                  <label class="form-label">{{ 'CHECKOUT.NOTES' | translate }}</label>
                  <textarea [(ngModel)]="form.notes" class="form-input" rows="2"
                    placeholder="Instructions spéciales, code d'accès..."></textarea>
                </div>
              </div>
            </div>

            <!-- Payment -->
            <div class="card p-5">
              <h2 class="text-base font-bold mb-4 flex items-center gap-2" style="color:var(--text-primary)">
                <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style="background:var(--primary)">2</span>
                Paiement
              </h2>
              <label class="flex items-center gap-4 p-4 rounded-2xl cursor-pointer"
                style="background:var(--bg-secondary,var(--bg));border:2px solid var(--primary)">
                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style="border-color:var(--primary)">
                  <div class="w-2.5 h-2.5 rounded-full" style="background:var(--primary)"></div>
                </div>
                <div class="flex-1">
                  <p class="font-bold text-sm" style="color:var(--text-primary)">
                    💵 {{ 'CHECKOUT.PAYMENT_COD' | translate }}
                  </p>
                  <p class="text-xs mt-0.5" style="color:var(--text-secondary)">
                    {{ 'CHECKOUT.PAYMENT_COD_DESC' | translate }}
                  </p>
                </div>
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style="background:#dcfce7;color:#16a34a">Disponible</span>
              </label>
            </div>
          </div>

          <!-- ── ORDER SUMMARY ── -->
          <div class="lg:col-span-1">
            <div class="card p-5 sticky top-24">
              <h2 class="text-base font-bold mb-4 flex items-center gap-2" style="color:var(--text-primary)">
                <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style="background:var(--primary)">3</span>
                {{ 'CART.SUMMARY' | translate }}
              </h2>

              <div class="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
                @for (item of cart.items(); track item.productId) {
                  <div class="flex gap-3 items-center text-sm">
                    <div class="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                      style="border:1px solid var(--border)">
                      @if (item.image) {
                        <img [src]="item.image" class="w-full h-full object-cover" />
                      } @else {
                        <div class="img-placeholder w-full h-full text-xs">💊</div>
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="truncate font-medium text-xs" style="color:var(--text-primary)">{{ item.name_fr }}</p>
                      <p class="text-xs" style="color:var(--text-secondary)">x{{ item.quantity }}</p>
                    </div>
                    <span class="font-bold shrink-0 text-sm" style="color:var(--primary)">
                      {{ item.unit_price * item.quantity | number:'1.2-2' }}
                    </span>
                  </div>
                }
              </div>

              <div class="border-t pt-3 space-y-2 text-sm" style="border-color:var(--border)">
                <div class="flex justify-between">
                  <span style="color:var(--text-secondary)">{{ 'CART.SUBTOTAL' | translate }}</span>
                  <span>{{ cart.subtotal() | number:'1.2-2' }} TND</span>
                </div>
                <div class="flex justify-between">
                  <span style="color:var(--text-secondary)">{{ 'CART.DELIVERY' | translate }}</span>
                  @if (cart.deliveryFee() === 0) {
                    <span class="font-semibold" style="color:#16a34a">Gratuite 🎉</span>
                  } @else {
                    <span>{{ cart.deliveryFee() | number:'1.2-2' }} TND</span>
                  }
                </div>
                @if (cart.discount() > 0) {
                  <div class="flex justify-between">
                    <span style="color:#16a34a">🎟️ Coupon <strong class="font-mono">{{ cart.appliedCoupon()!.code }}</strong></span>
                    <span class="font-semibold" style="color:#16a34a">-{{ cart.discount() | number:'1.2-2' }} TND</span>
                  </div>
                }
                <div class="flex justify-between font-extrabold text-base pt-2 border-t"
                  style="border-color:var(--border)">
                  <span>{{ 'CART.TOTAL' | translate }}</span>
                  <span style="color:var(--primary)">{{ cart.total() | number:'1.2-2' }} TND</span>
                </div>
              </div>

              @if (error()) {
                <div class="mt-4 p-3 rounded-xl text-sm" style="background:#fee2e2;color:#dc2626">
                  ⚠ {{ error() }}
                </div>
              }

              <button
                (click)="placeOrder()"
                [disabled]="loading() || !isFormValid()"
                class="btn-primary w-full justify-center mt-5 py-3"
                [style.opacity]="loading() || !isFormValid() ? '0.55' : '1'">
                @if (loading()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {{ 'CHECKOUT.PLACING' | translate }}
                } @else {
                  ✅ {{ 'CHECKOUT.PLACE_ORDER' | translate }}
                }
              </button>

              <p class="text-xs text-center mt-3" style="color:var(--text-secondary)">
                🔒 Commande sécurisée · Paiement à la livraison
              </p>
            </div>
          </div>

        </div>
      }
    </div>
  `,
})
export class CheckoutComponent implements OnInit {
  protected cart     = inject(CartService);
  private   orderSvc = inject(OrderService);
  protected auth     = inject(AuthService);
  private   router   = inject(Router);

  readonly wilayas = WILAYAS;
  readonly loading  = signal(false);
  readonly success  = signal(false);
  readonly orderId  = signal('');
  readonly error    = signal('');

  form = {
    full_name: '',
    phone:     '',
    email:     '',
    address:   '',
    city:      '',
    wilaya:    '',
    notes:     '',
  };

  protected readonly loggedIn = this.auth.isLoggedIn;
  get userEmail(): string { return this.auth.currentUser()?.email ?? ''; }

  ngOnInit(): void {
    // Pre-fill form from profile when logged in
    const profile = this.auth.userProfile();
    const user    = this.auth.currentUser();
    if (profile) {
      this.form.full_name = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
      this.form.phone     = profile.phone ?? '';
    }
    if (user) {
      this.form.email = user.email ?? '';
    }
  }

  isFormValid(): boolean {
    const f = this.form;
    const emailOk = this.loggedIn() ? true : !!f.email?.includes('@');
    return !!(f.full_name && f.phone && f.address && f.city && f.wilaya && emailOk);
  }

  async placeOrder(): Promise<void> {
    if (!this.isFormValid() || this.cart.items().length === 0) return;

    this.loading.set(true);
    this.error.set('');
    try {
      const user    = this.auth.currentUser();
      const email   = user?.email ?? this.form.email;
      const items   = this.cart.items().map(i => ({
        productId:  i.productId,
        name_fr:    i.name_fr,
        image:      i.image,
        unit_price: i.unit_price,
        quantity:   i.quantity,
        subtotal:   +(i.unit_price * i.quantity).toFixed(2),
      }));
      const subtotal     = +this.cart.subtotal().toFixed(2);
      const deliveryFee  = +this.cart.deliveryFee().toFixed(2);
      const discount     = +this.cart.discount().toFixed(2);
      const total        = +this.cart.total().toFixed(2);
      const coupon       = this.cart.appliedCoupon();

      const id = await this.orderSvc.create({
        user_id:    user?.id ?? null,
        user_email: email,
        items,
        subtotal,
        delivery_fee:     deliveryFee,
        discount_amount:  discount || undefined,
        coupon_code:      coupon?.code || undefined,
        total,
        status:           'pending',
        payment_method:   'cod',
        delivery_address: {
          full_name: this.form.full_name,
          phone:     this.form.phone,
          address:   this.form.address,
          city:      this.form.city,
          wilaya:    this.form.wilaya,
          email:     email,
        },
        notes: this.form.notes || undefined,
      });

      this.cart.clear();
      this.orderId.set(id);
      this.success.set(true);
    } catch (e: any) {
      this.error.set(e.message ?? 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      this.loading.set(false);
    }
  }

  copyRef(): void {
    navigator.clipboard?.writeText(this.orderId()).catch(() => {});
  }
}
