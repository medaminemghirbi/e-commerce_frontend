import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { LanguageService } from '../../../core/services/language.service';
import { WishlistItem } from '../../../core/models/wishlist.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-10">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-extrabold" style="color:var(--text-primary)">
          ❤️ {{ 'WISHLIST.TITLE' | translate }}
        </h1>
        @if (wish.items().length > 0) {
          <button (click)="wish.clear()" class="btn-secondary text-sm">{{ 'WISHLIST.CLEAR' | translate }}</button>
        }
      </div>

      @if (wish.items().length === 0) {
        <div class="card p-16 text-center">
          <div class="text-6xl mb-4">🤍</div>
          <p class="text-lg mb-6" style="color:var(--text-secondary)">{{ 'WISHLIST.EMPTY' | translate }}</p>
          <a routerLink="/products" class="btn-primary">{{ 'WISHLIST.BROWSE' | translate }}</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (item of wish.items(); track item.productId) {
            <div class="card overflow-hidden">
              <!-- Image -->
              <div class="relative h-44 overflow-hidden">
                @if (item.image) {
                  <img [src]="item.image" class="w-full h-full object-cover" />
                } @else {
                  <div class="img-placeholder w-full h-full">💊</div>
                }
                @if (item.has_promotion) {
                  <span class="absolute top-2 left-2 badge badge-danger">-{{ item.promotion_discount }}%</span>
                }
                <button
                  (click)="wish.remove(item.productId)"
                  class="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
                  style="background:rgba(239,68,68,0.15)"
                >
                  <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </button>
              </div>

              <div class="p-4">
                <h3 class="font-semibold mb-1 line-clamp-2" style="color:var(--text-primary)">{{ getName(item) }}</h3>
                <div class="flex items-baseline gap-2 mb-4">
                  @if (item.has_promotion) {
                    <span class="font-bold" style="color:var(--primary)">{{ (item.price * 0.8) | number:'1.2-2' }} TND</span>
                    <span class="text-sm line-through" style="color:var(--text-secondary)">{{ item.price | number:'1.2-2' }}</span>
                  } @else {
                    <span class="font-bold" style="color:var(--primary)">{{ item.price | number:'1.2-2' }} TND</span>
                  }
                </div>
                <div class="flex gap-2">
                  <button (click)="addToCart(item)" class="btn-primary flex-1 justify-center text-sm py-2">
                    🛒 {{ 'WISHLIST.ADD_TO_CART' | translate }}
                  </button>
                  <a [routerLink]="['/products', item.productId]" class="btn-secondary px-3 py-2 text-sm">
                    {{ 'ADMIN.VIEW' | translate }}
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class WishlistComponent {
  protected wish = inject(WishlistService);
  private cart = inject(CartService);
  private lang = inject(LanguageService);

  getName(item: WishlistItem): string {
    const l = this.lang.lang();
    return (item as any)[`name_${l}`] ?? item.name_fr ?? item.name_en;
  }

  addToCart(item: WishlistItem): void {
    this.cart.add({
      productId: item.productId,
      name_fr: item.name_fr,
      name_en: item.name_en,
      name_ar: item.name_ar,
      image: item.image,
      unit_price: item.has_promotion ? +(item.price * 0.8).toFixed(2) : item.price,
      quantity: 1,
    });
  }
}
