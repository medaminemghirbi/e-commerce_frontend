import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { LanguageService } from '../../../../core/services/language.service';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { AstuceService } from '../../../../core/services/astuce.service';
import { Product } from '../../../../core/models/product.model';
import { Astuce } from '../../../../core/models/astuce.model';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <!-- Breadcrumb -->
      <nav class="flex items-center flex-wrap gap-1.5 text-sm mb-6" style="color: var(--text-secondary)">
        <a routerLink="/" class="hover:text-[#008000] transition-colors">{{ 'NAV.HOME' | translate }}</a>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <a routerLink="/products" class="hover:text-[#008000] transition-colors">{{ 'NAV.PRODUCTS' | translate }}</a>
        @if (categoryName()) {
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <a [routerLink]="['/products']" [queryParams]="{ category: product()?.category_id }"
            class="hover:text-[#008000] transition-colors">{{ categoryName() }}</a>
        }
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span style="color:var(--text-primary)" class="font-medium">{{ getName() }}</span>
      </nav>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="skeleton h-96 rounded-2xl"></div>
          <div class="space-y-4">
            <div class="skeleton h-6 w-1/3 rounded-full"></div>
            <div class="skeleton h-8 w-3/4 rounded"></div>
            <div class="skeleton h-4 w-full rounded"></div>
            <div class="skeleton h-4 w-2/3 rounded"></div>
            <div class="skeleton h-24 rounded-xl mt-4"></div>
          </div>
        </div>
      } @else if (product()) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">

          <!-- ── Images ─────────────────────────────────────── -->
          <div>
            <div class="rounded-2xl overflow-hidden h-80 mb-3" style="border: 1px solid var(--border)">
              @if (product()!.images.length) {
                <img [src]="product()!.images[activeImage()]" [alt]="getName()"
                  class="w-full h-full object-contain" style="background: var(--bg)" />
              } @else {
                <div class="img-placeholder w-full h-full">
                  <svg class="w-24 h-24 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              }
            </div>
            @if (product()!.images.length > 1) {
              <div class="flex gap-2 overflow-x-auto pb-1">
                @for (img of product()!.images; track img; let i = $index) {
                  <button (click)="activeImage.set(i)"
                    class="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all"
                    [style.border-color]="activeImage() === i ? 'var(--primary)' : 'var(--border)'">
                    <img [src]="img" class="w-full h-full object-cover" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- ── Info ───────────────────────────────────────── -->
          <div class="space-y-4">

            <!-- Category + subcategory badges -->
            <div class="flex flex-wrap gap-2">
              @if (categoryName()) {
                <a [routerLink]="['/products']" [queryParams]="{ category: product()?.category_id }"
                  class="badge badge-primary flex items-center gap-1 hover:opacity-80 transition-opacity">
                  🏷️ {{ categoryName() }}
                </a>
              }
              @for (sub of (product()?.subcategories_detail ?? []); track sub.id) {
                <span class="badge flex items-center gap-1"
                  style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
                  {{ sub.icon || '📂' }} {{ sub.name_fr }}
                </span>
              }
              @if (product()!.has_promotion) {
                <span class="badge badge-danger">🎉 -{{ product()!.promotion_discount }}%</span>
              }
              @if (product()!.stock_quantity <= 2 && product()!.stock_quantity > 0) {
                <span class="badge badge-warning">{{ 'PRODUCT.LOW_STOCK' | translate }}</span>
              }
              @if (product()!.stock_quantity === 0) {
                <span class="badge badge-danger">{{ 'PRODUCT.OUT_OF_STOCK' | translate }}</span>
              }
            </div>

            <!-- Marque -->
            @if (product()!.marque) {
              <a [routerLink]="['/marques', product()!.marque!.id]"
                class="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:border-sky-400"
                style="border-color:var(--border);background:var(--bg-secondary)">
                @if (product()!.marque!.image) {
                  <img [src]="product()!.marque!.image" class="w-12 h-12 rounded-lg object-contain" style="border:1px solid var(--border)" />
                } @else {
                  <div class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style="background:var(--bg)">🎯</div>
                }
                <div>
                  <p class="text-xs mb-0.5" style="color:var(--text-secondary)">Marque</p>
                  <p class="font-semibold text-sm" style="color:var(--text-primary)">{{ product()!.marque!.name }}</p>
                </div>
                <svg class="w-4 h-4 ml-auto" style="color:var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            }

            <!-- Title + description -->
            <h1 class="text-3xl font-extrabold" style="color: var(--text-primary)">{{ getName() }}</h1>
            <p class="text-base leading-relaxed" style="color: var(--text-secondary)">{{ getDesc() }}</p>

            <!-- Keywords -->
            @if ((product()?.keywords ?? []).length) {
              <div class="flex flex-wrap gap-1.5">
                @for (kw of product()!.keywords!; track kw) {
                  <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                    style="background:var(--bg-secondary);color:var(--text-secondary);border:1px solid var(--border)">
                    # {{ kw }}
                  </span>
                }
              </div>
            }

            <!-- Price card -->
            <div class="card p-5">
              @if (product()!.has_promotion) {
                <div class="flex items-baseline gap-3 mb-1">
                  <span class="text-3xl font-extrabold" style="color: var(--primary)">
                    {{ discountedPrice() | number:'1.2-2' }} TND
                  </span>
                  <span class="text-lg line-through" style="color: var(--text-secondary)">
                    {{ product()!.price | number:'1.2-2' }} TND
                  </span>
                </div>
                <p class="text-sm" style="color: var(--success)">{{ 'PRODUCT.PROMOTION_ACTIVE' | translate }}</p>
              } @else {
                <span class="text-3xl font-extrabold" style="color: var(--primary)">
                  {{ product()!.price | number:'1.2-2' }} TND
                </span>
              }
              <p class="text-sm mt-2" style="color: var(--text-secondary)">
                {{ 'PRODUCT.STOCK' | translate }}: <strong [style.color]="product()!.stock_quantity === 0 ? '#ef4444' : product()!.stock_quantity <= 2 ? '#f59e0b' : 'var(--success)'">{{ product()!.stock_quantity }}</strong>
              </p>
            </div>

            <!-- Product details table -->
            <div class="rounded-xl overflow-hidden" style="border:1px solid var(--border)">
              @if (product()!.barcode) {
                <div class="flex justify-between items-center px-4 py-2.5 border-b" style="border-color:var(--border);background:var(--bg-secondary)">
                  <span class="text-sm" style="color:var(--text-secondary)">🔲 Code à barre</span>
                  <span class="font-mono text-sm font-medium tracking-widest" style="color:var(--text-primary)">{{ product()!.barcode }}</span>
                </div>
              }
              @if (product()!.manufacture_date) {
                <div class="flex justify-between px-4 py-2.5 border-b" style="border-color:var(--border)">
                  <span class="text-sm" style="color:var(--text-secondary)">{{ 'PRODUCT.MANUFACTURE_DATE' | translate }}</span>
                  <span class="text-sm font-medium" style="color:var(--text-primary)">{{ product()!.manufacture_date }}</span>
                </div>
              }
              @if (product()!.expiration_date) {
                <div class="flex justify-between px-4 py-2.5" style="border-color:var(--border)">
                  <span class="text-sm" style="color:var(--text-secondary)">{{ 'PRODUCT.EXPIRATION_DATE' | translate }}</span>
                  <span class="text-sm font-medium" style="color:var(--text-primary)">{{ product()!.expiration_date }}</span>
                </div>
              }
            </div>

            <!-- CTA -->
            <div class="flex gap-3">
              @if (product()!.stock_quantity === 0) {
                <button disabled class="flex-1 py-3 text-base rounded-xl font-semibold cursor-not-allowed bg-gray-200 text-gray-500">
                  {{ 'PRODUCT.OUT_OF_STOCK' | translate }}
                </button>
              } @else {
                <button (click)="addToCart()"
                  class="btn-primary flex-1 justify-center py-3 text-base">
                  @if (inCart()) { ✓ {{ 'CART.IN_CART' | translate }} }
                  @else { 🛒 {{ 'CART.ADD' | translate }} }
                </button>
              }
              <button (click)="toggleWishlist()"
                class="w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all"
                [style.border-color]="inWishlist() ? '#ef4444' : 'var(--border)'"
                [style.background]="inWishlist() ? 'rgba(239,68,68,0.08)' : 'var(--bg-card)'">
                <svg class="w-5 h-5" [style.fill]="inWishlist() ? '#ef4444' : 'none'" [style.stroke]="inWishlist() ? '#ef4444' : 'var(--text-secondary)'" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Astuces liées -->
        @if (linkedAstuces().length > 0) {
          <div class="mt-10">
            <h2 class="text-xl font-bold mb-5 flex items-center gap-2" style="color:var(--text-primary)">
              <span class="text-2xl">💡</span> Astuces liées à ce produit
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              @for (a of linkedAstuces(); track a.id) {
                <a [routerLink]="['/astuces', a.id]"
                  class="card overflow-hidden flex gap-4 p-4 group hover:-translate-y-0.5 transition-all"
                  style="text-decoration:none">
                  <div class="w-20 h-20 rounded-xl overflow-hidden shrink-0" style="background:var(--bg-secondary)">
                    @if (a.images.length) {
                      <img [src]="a.images[0]" class="w-full h-full object-cover" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-3xl opacity-25">💡</div>
                    }
                  </div>
                  <div class="flex flex-col justify-center">
                    <span class="text-xs font-bold mb-1" style="color:var(--primary)">{{ a.category }}</span>
                    <p class="text-sm font-semibold line-clamp-2" style="color:var(--text-primary)">{{ a.title }}</p>
                  </div>
                </a>
              }
            </div>
          </div>
        }

      } @else {
        <div class="card p-16 text-center">
          <p style="color: var(--text-secondary)">{{ 'PRODUCT.NOT_FOUND' | translate }}</p>
          <a routerLink="/products" class="btn-primary mt-4">{{ 'PRODUCTS.BACK' | translate }}</a>
        </div>
      }
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private productSvc  = inject(ProductService);
  private categorySvc = inject(CategoryService);
  private langSvc     = inject(LanguageService);
  private cartSvc     = inject(CartService);
  private wishSvc     = inject(WishlistService);
  private astuceSvc   = inject(AstuceService);
  private route       = inject(ActivatedRoute);
  private seo         = inject(SeoService);

  protected product       = signal<Product | null>(null);
  protected loading       = signal(true);
  protected activeImage   = signal(0);
  protected categoryName  = signal('');
  protected linkedAstuces = signal<Astuce[]>([]);

  inCart():     boolean { return this.cartSvc.isInCart(this.product()?.id ?? ''); }
  inWishlist(): boolean { return this.wishSvc.isInWishlist(this.product()?.id ?? ''); }

  discountedPrice(): number {
    const p = this.product();
    if (!p) return 0;
    return +(p.price * (1 - (p.promotion_discount ?? 0) / 100)).toFixed(2);
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cartSvc.add({
      productId: p.id!,
      name_fr: p.name_fr, name_en: p.name_en, name_ar: p.name_ar,
      image: p.images?.[0] ?? '',
      unit_price: this.discountedPrice(),
      quantity: 1,
    });
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    this.wishSvc.toggle({
      productId: p.id!,
      name_fr: p.name_fr, name_en: p.name_en, name_ar: p.name_ar,
      image: p.images?.[0] ?? '',
      price: p.price,
      has_promotion: p.has_promotion ?? false,
      promotion_discount: p.promotion_discount ?? 0,
    });
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const p = await this.productSvc.getById(id);
      this.product.set(p);
      if (p) {
        this.seo.setProduct(p);
        this.astuceSvc.getAll().subscribe(list =>
          this.linkedAstuces.set(list.filter(a => a.product_id === p.id))
        );
        if (p.category_id) {
          const cat = await this.categorySvc.getById(p.category_id);
          if (cat) {
            const l = this.langSvc.lang();
            this.categoryName.set((cat as any)[`name_${l}`] ?? cat.name_fr ?? '');
          }
        }
      }
    }
    this.loading.set(false);
  }

  getName(): string {
    const p = this.product();
    if (!p) return '';
    const l = this.langSvc.lang();
    return (p as any)[`name_${l}`] ?? p.name_fr ?? p.name_en;
  }

  getDesc(): string {
    const p = this.product();
    if (!p) return '';
    const l = this.langSvc.lang();
    return (p as any)[`description_${l}`] ?? p.description_fr ?? p.description_en ?? '';
  }
}
