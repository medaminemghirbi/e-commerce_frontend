import { Component, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Product } from '../../../core/models/product.model';
import { LanguageService } from '../../../core/services/language.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="card overflow-hidden group relative flex flex-col">
      <!-- Image -->
      <a [routerLink]="['/products', product().id]" class="block relative h-52 overflow-hidden shrink-0">
        @if (product().images.length) {
          <img
            [src]="product().images[0]"
            [alt]="getName()"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            [class.opacity-50]="product().stock_quantity === 0"
          />
        } @else {
          <div class="img-placeholder w-full h-full" [class.opacity-50]="product().stock_quantity === 0">
            <svg class="w-16 h-16 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
          </div>
        }
        <!-- Out of stock overlay -->
        @if (product().stock_quantity === 0) {
          <div class="absolute inset-0 flex items-center justify-center bg-black/30">
            <span class="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {{ 'PRODUCT.OUT_OF_STOCK' | translate }}
            </span>
          </div>
        }
        <!-- Badges -->
        <div class="absolute top-3 left-3 flex flex-col gap-1">
          @if (product().has_promotion) {
            <span class="badge badge-danger">-{{ product().promotion_discount }}%</span>
          }
          @if (product().stock_quantity > 0 && product().stock_quantity <= 2) {
            <span class="badge badge-warning">{{ 'PRODUCT.LOW_STOCK' | translate }}</span>
          }
        </div>
        <!-- Wishlist toggle -->
        <button
          (click)="toggleWishlist($event)"
          class="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all"
          [style.background]="inWishlist() ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.9)'"
        >
          <svg class="w-4 h-4 transition-colors" [style.fill]="inWishlist() ? '#ef4444' : 'none'" [style.stroke]="inWishlist() ? '#ef4444' : '#64748b'" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
      </a>

      <!-- Content -->
      <div class="p-4 flex flex-col flex-1">
        <a [routerLink]="['/products', product().id]" class="block flex-1">
          <h3 class="font-semibold text-base mb-1 line-clamp-2" style="color: var(--text-primary)">{{ getName() }}</h3>
          @if (product().marque) {
            <a [routerLink]="['/marques', product().marque!.id]" (click)="$event.stopPropagation()"
              class="inline-flex items-center gap-1.5 mb-2 text-xs font-medium px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
              style="background:var(--bg-secondary);color:var(--text-secondary);border:1px solid var(--border)">
              @if (product().marque!.image) {
                <img [src]="product().marque!.image" class="w-4 h-4 rounded object-contain" />
              }
              {{ product().marque!.name }}
            </a>
          }
          <p class="text-sm line-clamp-2 mb-3" style="color: var(--text-secondary)">{{ getDesc() }}</p>
        </a>

        <div class="flex items-center justify-between mb-3">
          <div>
            @if (product().has_promotion) {
              <div class="flex items-baseline gap-2">
                <span class="text-lg font-bold" style="color: var(--primary)">
                  {{ (product().price * 0.8) | number:'1.2-2' }} TND
                </span>
                <span class="text-sm line-through" style="color: var(--text-secondary)">
                  {{ product().price | number:'1.2-2' }}
                </span>
              </div>
            } @else {
              <span class="text-lg font-bold" style="color: var(--primary)">
                {{ product().price | number:'1.2-2' }} TND
              </span>
            }
          </div>
          <span class="text-xs" style="color: var(--text-secondary)">
            {{ 'PRODUCT.STOCK' | translate }}: {{ product().stock_quantity }}
          </span>
        </div>

        <!-- Add to cart -->
        @if (product().stock_quantity === 0) {
          <button disabled class="w-full text-sm py-2 rounded font-semibold cursor-not-allowed bg-gray-200 text-gray-500">
            {{ 'PRODUCT.OUT_OF_STOCK' | translate }}
          </button>
        } @else {
          <button
            (click)="addToCart()"
            class="btn-primary w-full justify-center text-sm py-2"
          >
            @if (inCart()) {
              ✓ {{ 'CART.IN_CART' | translate }}
            } @else {
              🛒 {{ 'CART.ADD' | translate }}
            }
          </button>
        }
      </div>
    </div>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();
  private lang = inject(LanguageService);
  private cart = inject(CartService);
  private wish = inject(WishlistService);

  inCart = computed(() => this.cart.isInCart(this.product().id!));
  inWishlist = computed(() => this.wish.isInWishlist(this.product().id!));

  getName(): string {
    const p = this.product();
    const l = this.lang.lang();
    return (p as any)[`name_${l}`] ?? p.name_fr ?? p.name_en;
  }

  getDesc(): string {
    const p = this.product();
    const l = this.lang.lang();
    return (p as any)[`description_${l}`] ?? p.description_fr ?? p.description_en;
  }

  addToCart(): void {
    const p = this.product();
    this.cart.add({
      productId: p.id!,
      name_fr: p.name_fr,
      name_en: p.name_en,
      name_ar: p.name_ar,
      image: p.images?.[0] ?? '',
      unit_price: p.has_promotion ? +(p.price * 0.8).toFixed(2) : p.price,
      quantity: 1,
    });
  }

  toggleWishlist(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const p = this.product();
    this.wish.toggle({
      productId: p.id!,
      name_fr: p.name_fr,
      name_en: p.name_en,
      name_ar: p.name_ar,
      image: p.images?.[0] ?? '',
      price: p.price,
      has_promotion: p.has_promotion ?? false,
      promotion_discount: p.promotion_discount ?? 0,
    });
  }
}
