import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CartService } from '../../../core/services/cart.service';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

const FREE_DELIVERY_THRESHOLD = 100;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-10">
      <h1 class="text-3xl font-extrabold mb-8" style="color:var(--text-primary)">
        🛒 {{ 'CART.TITLE' | translate }}
      </h1>

      @if (cart.items().length === 0) {
        <div class="card p-16 text-center">
          <div class="text-6xl mb-4">🛒</div>
          <p class="text-lg mb-6" style="color:var(--text-secondary)">{{ 'CART.EMPTY' | translate }}</p>
          <a routerLink="/products" class="btn-primary">{{ 'CART.BROWSE' | translate }}</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Items -->
          <div class="lg:col-span-2 space-y-4">
            @for (item of cart.items(); track item.productId) {
              <div class="card p-4 flex gap-4 items-center">
                <!-- Image -->
                <div class="w-20 h-20 rounded-xl overflow-hidden shrink-0" style="border:1px solid var(--border)">
                  @if (item.image) {
                    <img [src]="item.image" class="w-full h-full object-cover" />
                  } @else {
                    <div class="img-placeholder w-full h-full text-2xl">💊</div>
                  }
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold truncate" style="color:var(--text-primary)">{{ getName(item) }}</h3>
                  <p class="text-sm font-bold mt-1" style="color:var(--primary)">
                    {{ item.unit_price | number:'1.2-2' }} TND
                  </p>
                </div>

                <!-- Qty -->
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    (click)="cart.updateQty(item.productId, item.quantity - 1)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg transition-colors"
                    style="border:1px solid var(--border);color:var(--text-primary)"
                  >−</button>
                  <span class="w-8 text-center font-semibold" style="color:var(--text-primary)">{{ item.quantity }}</span>
                  <button
                    (click)="cart.updateQty(item.productId, item.quantity + 1)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg transition-colors"
                    style="border:1px solid var(--border);color:var(--text-primary)"
                  >+</button>
                </div>

                <!-- Line total -->
                <div class="shrink-0 text-right w-24">
                  <p class="font-bold" style="color:var(--text-primary)">
                    {{ item.unit_price * item.quantity | number:'1.2-2' }} TND
                  </p>
                </div>

                <!-- Remove -->
                <button (click)="cart.remove(item.productId)" class="text-red-400 hover:text-red-600 ml-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            }
          </div>

          <!-- Summary -->
          <div class="lg:col-span-1">
            <div class="card p-6 sticky top-24">
              <h2 class="text-lg font-bold mb-4" style="color:var(--text-primary)">{{ 'CART.SUMMARY' | translate }}</h2>

              <!-- Free delivery progress -->
              @if (cart.subtotal() < threshold) {
                <div class="mb-4 p-3 rounded-xl" style="background:var(--bg-secondary)">
                  <p class="text-xs font-medium mb-2" style="color:var(--text-secondary)">
                    🚚 Plus que <strong style="color:var(--primary)">{{ (threshold - cart.subtotal()) | number:'1.2-2' }} TND</strong> pour la livraison gratuite !
                  </p>
                  <div class="w-full rounded-full h-2 overflow-hidden" style="background:var(--border)">
                    <div class="h-2 rounded-full transition-all duration-500"
                      style="background:linear-gradient(90deg,var(--primary),var(--accent));width:{{ progressPct() }}%">
                    </div>
                  </div>
                  <div class="flex justify-between text-xs mt-1" style="color:var(--text-secondary)">
                    <span>0 TND</span><span>100 TND</span>
                  </div>
                </div>
              } @else {
                <div class="mb-4 p-3 rounded-xl text-center text-sm font-semibold" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
                  🎉 Livraison gratuite débloquée !
                </div>
              }

              <!-- ── Coupon ── -->
              <div class="mb-4">
                @if (!cart.appliedCoupon()) {
                  <div class="flex gap-2">
                    <input [(ngModel)]="couponCode" placeholder="Code coupon"
                      (keyup.enter)="applyCoupon()"
                      class="input flex-1 uppercase text-sm"
                      style="font-family:monospace;font-weight:700;letter-spacing:0.05em"
                      [disabled]="couponLoading()" />
                    <button (click)="applyCoupon()" [disabled]="couponLoading() || !couponCode.trim()"
                      class="px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                      style="background:var(--primary);color:#fff">
                      @if (couponLoading()) {
                        <div class="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin border-white"></div>
                      } @else {
                        Appliquer
                      }
                    </button>
                  </div>
                  @if (couponError()) {
                    <p class="text-xs mt-1.5 font-medium" style="color:#ef4444">❌ {{ couponError() }}</p>
                  }
                } @else {
                  <div class="flex items-center justify-between p-3 rounded-xl" style="background:#f0fdf4;border:1px solid #bbf7d0">
                    <div>
                      <p class="text-xs font-semibold" style="color:#16a34a">✅ Coupon appliqué</p>
                      <p class="font-mono font-bold text-sm mt-0.5" style="color:#15803d">{{ cart.appliedCoupon()!.code }}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold" style="color:#16a34a">-{{ cart.appliedCoupon()!.discount_amount | number:'1.2-2' }} TND</p>
                      <button (click)="cart.removeCoupon()" class="text-xs mt-0.5 underline" style="color:#dc2626">Retirer</button>
                    </div>
                  </div>
                }
              </div>

              <!-- Totals -->
              <div class="space-y-3 text-sm mb-4">
                <div class="flex justify-between">
                  <span style="color:var(--text-secondary)">{{ 'CART.SUBTOTAL' | translate }}</span>
                  <span style="color:var(--text-primary)">{{ cart.subtotal() | number:'1.2-2' }} TND</span>
                </div>
                @if (cart.discount() > 0) {
                  <div class="flex justify-between">
                    <span style="color:#16a34a">🎟️ Réduction</span>
                    <span class="font-semibold" style="color:#16a34a">-{{ cart.discount() | number:'1.2-2' }} TND</span>
                  </div>
                }
                <div class="flex justify-between">
                  <span style="color:var(--text-secondary)">{{ 'CART.DELIVERY' | translate }}</span>
                  @if (cart.deliveryFee() === 0) {
                    <span class="font-semibold" style="color:#16a34a">
                      <s class="text-xs font-normal" style="color:var(--text-secondary)">8.00 TND</s>
                      Gratuite 🎉
                    </span>
                  } @else {
                    <span style="color:var(--text-primary)">{{ cart.deliveryFee() | number:'1.2-2' }} TND</span>
                  }
                </div>
                <div class="pt-3 border-t flex justify-between font-bold text-base" style="border-color:var(--border)">
                  <span style="color:var(--text-primary)">{{ 'CART.TOTAL' | translate }}</span>
                  <span style="color:var(--primary)">{{ cart.total() | number:'1.2-2' }} TND</span>
                </div>
              </div>

              <div class="rounded-xl p-3 mb-4 text-sm text-center" style="background:var(--primary-light);color:var(--primary)">
                🚚 {{ 'CART.COD_ONLY' | translate }}
              </div>

              <a routerLink="/checkout" class="btn-primary w-full justify-center">
                {{ 'CART.CHECKOUT' | translate }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </a>
              @if (!auth.isLoggedIn()) {
                <p class="text-xs text-center mt-2" style="color:var(--text-secondary)">
                  <a routerLink="/auth/login" style="color:var(--primary)" class="font-semibold">Connectez-vous</a>
                  pour suivre vos commandes
                </p>
              }

              <button (click)="cart.clear()" class="btn-secondary w-full mt-3 text-sm">
                {{ 'CART.CLEAR' | translate }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartComponent {
  protected cart  = inject(CartService);
  protected auth  = inject(AuthService);
  private   lang  = inject(LanguageService);

  readonly threshold   = FREE_DELIVERY_THRESHOLD;
  readonly progressPct = computed(() =>
    Math.min(100, Math.round((this.cart.subtotal() / FREE_DELIVERY_THRESHOLD) * 100))
  );

  couponCode    = '';
  couponLoading = signal(false);
  couponError   = signal('');

  async applyCoupon(): Promise<void> {
    if (!this.couponCode.trim()) return;
    this.couponLoading.set(true);
    this.couponError.set('');
    const result = await this.cart.applyCoupon(this.couponCode);
    this.couponLoading.set(false);
    if (result.success) {
      this.couponCode = '';
    } else {
      this.couponError.set(result.message);
    }
  }

  getName(item: any): string {
    const l = this.lang.lang();
    return item[`name_${l}`] ?? item.name_fr ?? item.name_en;
  }
}
