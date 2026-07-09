import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CartItem } from '../models/cart.model';
import { AppliedCoupon } from '../models/coupon.model';
import { CouponService } from './coupon.service';

const KEY        = 'medicare-cart';
const COUPON_KEY = 'medicare-coupon';

@Injectable({ providedIn: 'root' })
export class CartService {
  private couponSvc = inject(CouponService);

  private _items         = signal<CartItem[]>(this.load());
  private _appliedCoupon = signal<AppliedCoupon | null>(this.loadCoupon());

  readonly items         = this._items.asReadonly();
  readonly appliedCoupon = this._appliedCoupon.asReadonly();

  readonly count       = computed(() => this._items().reduce((s, i) => s + i.quantity, 0));
  readonly subtotal    = computed(() => this._items().reduce((s, i) => s + i.unit_price * i.quantity, 0));
  readonly deliveryFee = computed(() => this.subtotal() >= 100 ? 0 : 8);

  // Always recalculated from current subtotal — never stale
  readonly discount = computed(() => {
    const c = this._appliedCoupon();
    if (!c) return 0;
    const sub = this.subtotal();
    return c.discount_type === 'percentage'
      ? +(sub * c.discount_value / 100).toFixed(2)
      : Math.min(c.discount_value, sub);
  });

  readonly total = computed(() => Math.max(0, this.subtotal() + this.deliveryFee() - this.discount()));

  add(item: CartItem): void {
    const list = this._items();
    const idx  = list.findIndex(i => i.productId === item.productId);
    if (idx >= 0) {
      const updated = [...list];
      updated[idx]  = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
      this._items.set(updated);
    } else {
      this._items.set([...list, item]);
    }
    this.save();
  }

  remove(productId: number | string): void {
    this._items.set(this._items().filter(i => i.productId !== productId));
    this.save();
  }

  updateQty(productId: number | string, qty: number): void {
    if (qty <= 0) { this.remove(productId); return; }
    this._items.set(this._items().map(i => i.productId === productId ? { ...i, quantity: qty } : i));
    this.save();
  }

  isInCart(productId: number | string): boolean {
    return this._items().some(i => i.productId === productId);
  }

  async applyCoupon(code: string): Promise<{ success: boolean; message: string }> {
    const amount = this.subtotal();
    try {
      const res = await firstValueFrom(this.couponSvc.validate(code.trim().toUpperCase(), amount));
      console.log('Coupon validation response:', res);
      if (!res) return { success: false, message: 'Erreur de validation.' };
      if (!res.valid) return { success: false, message: res.message ?? 'Code invalide.' };

      const applied: AppliedCoupon = {
        code:            code.trim().toUpperCase(),
        discount_type:   res.discount_type!,
        discount_value:  res.discount_value!,
        discount_amount: res.discount_amount!,
      };
      this._appliedCoupon.set(applied);
      localStorage.setItem(COUPON_KEY, JSON.stringify(applied));
      return { success: true, message: `Coupon appliqué ! -${this.discount().toFixed(2)} TND` };
    } catch {
      return { success: false, message: 'Code invalide ou expiré.' };
    }
  }

  removeCoupon(): void {
    this._appliedCoupon.set(null);
    localStorage.removeItem(COUPON_KEY);
  }

  clear(): void {
    this._items.set([]);
    localStorage.removeItem(KEY);
    this.removeCoupon();
  }

  private save(): void {
    localStorage.setItem(KEY, JSON.stringify(this._items()));
  }

  private load(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }

  private loadCoupon(): AppliedCoupon | null {
    try { return JSON.parse(localStorage.getItem(COUPON_KEY) ?? 'null'); }
    catch { return null; }
  }
}
