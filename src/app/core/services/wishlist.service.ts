import { Injectable, signal, computed } from '@angular/core';
import { WishlistItem } from '../models/wishlist.model';

const KEY = 'medicare-wishlist';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private _items = signal<WishlistItem[]>(this.load());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  toggle(item: WishlistItem): void {
    const list = this._items();
    const idx = list.findIndex(i => i.productId === item.productId);
    if (idx >= 0) {
      this._items.set(list.filter(i => i.productId !== item.productId));
    } else {
      this._items.set([...list, item]);
    }
    this.save();
  }

  isInWishlist(productId: number | string): boolean {
    return this._items().some(i => i.productId === productId);
  }

  remove(productId: number | string): void {
    this._items.set(this._items().filter(i => i.productId !== productId));
    this.save();
  }

  clear(): void {
    this._items.set([]);
    localStorage.removeItem(KEY);
  }

  private save(): void {
    localStorage.setItem(KEY, JSON.stringify(this._items()));
  }

  private load(): WishlistItem[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }
}
