import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { SubcategoryService } from '../../../../core/services/subcategory.service';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { LanguageService } from '../../../../core/services/language.service';
import { Product } from '../../../../core/models/product.model';
import { SeoService } from '../../../../core/services/seo.service';

const PER_PAGE = 12;

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe, ProductCardComponent, SearchBarComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold mb-2" style="color: var(--text-primary)">{{ 'PRODUCTS.TITLE' | translate }}</h1>
        <p style="color: var(--text-secondary)">{{ 'PRODUCTS.SUBTITLE' | translate }}</p>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">

        <!-- ── Filters Sidebar ────────────────────────────── -->
        <aside class="w-full lg:w-64 shrink-0">
          <div class="card p-5 sticky top-24 space-y-5">

            <!-- Search -->
            <div>
              <app-search-bar (changed)="onSearch($event)" [placeholder]="'SEARCH.PLACEHOLDER' | translate" />
              @if (search()) {
                <p class="text-xs mt-1.5" style="color:var(--text-secondary)">
                  Recherche dans noms, descriptions, mots-clés, code à barre, sous-catégories…
                </p>
              }
            </div>

            <!-- Categories -->
            <div>
              <p class="form-label mb-2">{{ 'PRODUCTS.CATEGORY' | translate }}</p>
              <div class="space-y-0.5">
                <button (click)="selectCategory('')"
                  class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between"
                  [style.background]="!selectedCategory() ? 'var(--primary-light)' : ''"
                  [style.color]="!selectedCategory() ? 'var(--primary)' : 'var(--text-secondary)'"
                  [class.font-semibold]="!selectedCategory()">
                  <span>{{ 'PRODUCTS.ALL_CATEGORIES' | translate }}</span>
                  <span class="text-xs opacity-60">{{ allProducts().length }}</span>
                </button>
                @for (cat of categories(); track cat.id) {
                  <button (click)="selectCategory(cat.id ?? '')"
                    class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                    [style.background]="selectedCategory() === cat.id ? 'var(--primary-light)' : ''"
                    [style.color]="selectedCategory() === cat.id ? 'var(--primary)' : 'var(--text-secondary)'"
                    [class.font-semibold]="selectedCategory() === cat.id">
                    <span>{{ cat.icon || '🏥' }}</span>
                    <span class="flex-1 truncate">{{ getCatName(cat) }}</span>
                    <span class="text-xs opacity-60">{{ countByCategory(cat.id!) }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Subcategories (visible when a category is selected) -->
            @if (selectedCategory() && visibleSubcats().length) {
              <div>
                <p class="form-label mb-2">🗂️ Sous-catégories</p>
                <div class="space-y-0.5">
                  <button (click)="selectedSubcat.set('')"
                    class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                    [style.background]="!selectedSubcat() ? 'var(--bg-secondary)' : ''"
                    [style.color]="!selectedSubcat() ? 'var(--text-primary)' : 'var(--text-secondary)'"
                    [class.font-semibold]="!selectedSubcat()">
                    Toutes
                  </button>
                  @for (sub of visibleSubcats(); track sub.id) {
                    <button (click)="selectedSubcat.set(sub.id ?? '')"
                      class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                      [style.background]="selectedSubcat() === sub.id ? 'var(--primary-light)' : ''"
                      [style.color]="selectedSubcat() === sub.id ? 'var(--primary)' : 'var(--text-secondary)'"
                      [class.font-semibold]="selectedSubcat() === sub.id">
                      <span>{{ sub.icon || '📂' }}</span>
                      <span class="truncate">{{ sub.name_fr }}</span>
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Price Range -->
            <div>
              <label class="form-label mb-2">{{ 'PRODUCTS.MAX_PRICE' | translate }}: <strong>{{ maxPrice() }} TND</strong></label>
              <input type="range" min="0" max="1000" step="10"
                [value]="maxPrice()" (input)="onMaxPrice(+$any($event.target).value)"
                class="w-full" style="accent-color:var(--primary)" />
              <div class="flex justify-between text-xs mt-1" style="color:var(--text-secondary)">
                <span>0</span><span>1000 TND</span>
              </div>
            </div>

            <!-- In stock -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="inStockOnly" (ngModelChange)="resetPage()" class="w-4 h-4" style="accent-color:var(--primary)" />
              <span class="text-sm" style="color: var(--text-primary)">{{ 'PRODUCTS.IN_STOCK_ONLY' | translate }}</span>
            </label>

            <!-- Promo only -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" [(ngModel)]="promoOnly" (ngModelChange)="resetPage()" class="w-4 h-4" style="accent-color:#f59e0b" />
              <span class="text-sm" style="color: var(--text-primary)">🎉 Promotions uniquement</span>
            </label>

            <!-- Active filters summary -->
            @if (activeFiltersCount() > 0) {
              <button (click)="resetFilters()"
                class="w-full py-2 rounded-xl text-sm font-medium transition-colors"
                style="background:#fee2e2;color:#dc2626">
                ✕ Réinitialiser les filtres ({{ activeFiltersCount() }})
              </button>
            }
          </div>
        </aside>

        <!-- ── Product Grid ─────────────────────────────── -->
        <div class="flex-1 min-w-0">

          <!-- Active filters chips -->
          @if (search() || selectedCategory() || selectedSubcat()) {
            <div class="flex flex-wrap gap-2 mb-4">
              @if (search()) {
                <span class="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style="background:var(--primary-light);color:var(--primary)">
                  🔍 "{{ search() }}"
                  <button (click)="onSearch('')" class="ml-1 font-bold">✕</button>
                </span>
              }
              @if (selectedCategory()) {
                <span class="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style="background:var(--primary-light);color:var(--primary)">
                  {{ getCategoryName(selectedCategory()) }}
                  <button (click)="selectCategory('')" class="ml-1 font-bold">✕</button>
                </span>
              }
              @if (selectedSubcat()) {
                <span class="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                  style="background:var(--primary-light);color:var(--primary)">
                  🗂️ {{ getSubcatName(selectedSubcat()) }}
                  <button (click)="selectedSubcat.set('')" class="ml-1 font-bold">✕</button>
                </span>
              }
            </div>
          }

          <!-- Sort + count -->
          <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span class="text-sm font-medium" style="color: var(--text-secondary)">
              Affichant
              <strong style="color:var(--text-primary)">{{ pageStart() }}–{{ pageEnd() }}</strong>
              sur
              <strong style="color:var(--text-primary)">{{ sorted().length }}</strong>
              {{ 'PRODUCTS.RESULTS' | translate }}
            </span>
            <select [(ngModel)]="sortBy" (ngModelChange)="resetPage()" class="form-input py-2 w-auto text-sm">
              <option value="newest">{{ 'PRODUCTS.SORT.NEWEST' | translate }}</option>
              <option value="price_asc">{{ 'PRODUCTS.SORT.PRICE_ASC' | translate }}</option>
              <option value="price_desc">{{ 'PRODUCTS.SORT.PRICE_DESC' | translate }}</option>
              <option value="name">{{ 'PRODUCTS.SORT.NAME' | translate }}</option>
            </select>
          </div>

          @if (sorted().length) {
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              @for (p of paginated(); track p.id) {
                <app-product-card [product]="p" />
              }
            </div>

            <!-- ── Pagination ───────────────────────────── -->
            @if (totalPages() > 1) {
              <div class="flex items-center justify-center gap-1 mt-10 flex-wrap">

                <!-- Prev -->
                <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1"
                  class="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style="background:var(--bg-secondary);color:var(--text-primary)">
                  ← Préc.
                </button>

                <!-- Page numbers -->
                @for (p of pageNumbers(); track p) {
                  @if (p === -1) {
                    <span class="px-2 py-2 text-sm" style="color:var(--text-secondary)">…</span>
                  } @else {
                    <button (click)="goToPage(p)"
                      class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                      [style.background]="currentPage() === p ? 'var(--primary)' : 'var(--bg-secondary)'"
                      [style.color]="currentPage() === p ? '#fff' : 'var(--text-primary)'">
                      {{ p }}
                    </button>
                  }
                }

                <!-- Next -->
                <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()"
                  class="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style="background:var(--bg-secondary);color:var(--text-primary)">
                  Suiv. →
                </button>
              </div>

              <!-- Page info -->
              <p class="text-center text-xs mt-3" style="color:var(--text-secondary)">
                Page {{ currentPage() }} sur {{ totalPages() }}
              </p>
            }

          } @else {
            <div class="card p-16 text-center">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background: var(--primary-light)">
                <svg class="w-8 h-8" style="color: var(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 class="font-bold text-lg mb-1" style="color: var(--text-primary)">{{ 'PRODUCTS.NO_RESULTS' | translate }}</h3>
              <p style="color: var(--text-secondary)">{{ 'PRODUCTS.TRY_DIFFERENT' | translate }}</p>
              <button (click)="resetFilters()" class="btn-primary mt-4">Réinitialiser</button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProductListComponent implements OnInit {
  private productSvc     = inject(ProductService);
  private categorySvc    = inject(CategoryService);
  private subcategorySvc = inject(SubcategoryService);
  private langSvc        = inject(LanguageService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private seo            = inject(SeoService);

  protected allProducts   = toSignal(this.productSvc.getAllPublic(),   { initialValue: [] as Product[] });
  protected categories    = toSignal(this.categorySvc.getAll(),        { initialValue: [] });
  protected allSubcats    = toSignal(this.subcategorySvc.getAll(),     { initialValue: [] });

  protected search           = signal('');
  protected selectedCategory = signal<number | string>('');
  protected selectedSubcat   = signal<number | string>('');
  protected maxPrice         = signal(1000);
  protected currentPage      = signal(1);
  protected inStockOnly      = false;
  protected promoOnly        = false;
  protected sortBy           = 'newest';

  protected visibleSubcats = computed(() =>
    this.allSubcats().filter((s: any) => String(s.category_id) === String(this.selectedCategory()))
  );

  protected activeFiltersCount = computed(() => {
    let n = 0;
    if (this.search())            n++;
    if (this.selectedCategory())  n++;
    if (this.selectedSubcat())    n++;
    if (this.inStockOnly)         n++;
    if (this.promoOnly)           n++;
    if (this.maxPrice() < 1000) n++;
    return n;
  });

  protected filtered = computed(() => {
    let list = this.allProducts();
    const q   = this.search().toLowerCase().trim();
    const cat = this.selectedCategory();
    const sub = this.selectedSubcat();
    const max = this.maxPrice();
    const l   = this.langSvc.lang();

    if (q) {
      list = list.filter(p => {
        const name    = [`name_${l}`, 'name_fr', 'name_ar', 'name_en'].map(k => (p as any)[k] ?? '').join(' ').toLowerCase();
        const desc    = [`description_${l}`, 'description_fr'].map(k => (p as any)[k] ?? '').join(' ').toLowerCase();
        const kw      = (p.keywords ?? []).join(' ').toLowerCase();
        const barcode = (p.barcode ?? '').toLowerCase();
        const subcats = (p.subcategories_detail ?? []).map((s: any) => s.name_fr ?? '').join(' ').toLowerCase();
        return name.includes(q) || desc.includes(q) || kw.includes(q) || barcode.includes(q) || subcats.includes(q);
      });
    }

    if (cat) list = list.filter(p => String(p.category_id) === String(cat));
    if (sub) list = list.filter(p => (p.subcategory_ids ?? []).map(String).includes(String(sub)));
    list = list.filter(p => p.price <= max);
    if (this.inStockOnly) list = list.filter(p => p.stock_quantity > 0);
    if (this.promoOnly)   list = list.filter(p => p.has_promotion);

    return list;
  });

  protected sorted = computed(() => {
    const list = [...this.filtered()];
    switch (this.sortBy) {
      case 'price_asc':  return list.sort((a, b) => a.price - b.price);
      case 'price_desc': return list.sort((a, b) => b.price - a.price);
      case 'name':       return list.sort((a, b) => (a.name_fr ?? '').localeCompare(b.name_fr ?? ''));
      default:           return list;
    }
  });

  protected totalPages = computed(() => Math.max(1, Math.ceil(this.sorted().length / PER_PAGE)));
  protected pageStart  = computed(() => this.sorted().length === 0 ? 0 : (this.currentPage() - 1) * PER_PAGE + 1);
  protected pageEnd    = computed(() => Math.min(this.currentPage() * PER_PAGE, this.sorted().length));

  protected paginated = computed(() => {
    const start = (this.currentPage() - 1) * PER_PAGE;
    return this.sorted().slice(start, start + PER_PAGE);
  });

  protected pageNumbers = computed(() => {
    const total   = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  constructor() {
    // Reset to page 1 whenever filters change
    effect(() => {
      this.search();
      this.selectedCategory();
      this.selectedSubcat();
      this.maxPrice();
      this.currentPage.set(1);
    });
  }

  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(clamped);
    this.router.navigate([], { queryParams: { page: clamped }, queryParamsHandling: 'merge', replaceUrl: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetPage(): void {
    this.currentPage.set(1);
  }

  onSearch(q: string): void {
    this.search.set(q);
  }

  onMaxPrice(v: number): void {
    this.maxPrice.set(v);
  }

  selectCategory(id: number | string): void {
    this.selectedCategory.set(id);
    this.selectedSubcat.set('');
  }

  resetFilters(): void {
    this.search.set('');
    this.selectedCategory.set('');
    this.selectedSubcat.set('');
    this.maxPrice.set(1000);
    this.inStockOnly = false;
    this.promoOnly   = false;
    this.currentPage.set(1);
  }

  countByCategory(catId: number | string): number {
    return this.allProducts().filter(p => String(p.category_id) === String(catId)).length;
  }

  getCatName(cat: any): string {
    const l = this.langSvc.lang();
    return cat[`name_${l}`] ?? cat.name_fr ?? '';
  }

  getCategoryName(id: number | string): string {
    const cat = this.categories().find((c: any) => String(c.id) === String(id)) as any;
    return cat ? this.getCatName(cat) : String(id);
  }

  getSubcatName(id: number | string): string {
    const sub = this.allSubcats().find((s: any) => String(s.id) === String(id)) as any;
    return sub?.name_fr ?? String(id);
  }

  ngOnInit(): void {
    this.seo.set({
      title: 'Catalogue produits',
      description: 'Découvrez notre catalogue complet de produits paramédicaux — médicaments, soins, matériel médical disponibles en Tunisie.',
    });
    this.route.queryParams.subscribe(p => {
      if (p['category']) this.selectedCategory.set(p['category']);
      if (p['q'])        this.search.set(p['q']);
      if (p['page'])     this.currentPage.set(Math.max(1, +p['page']));
    });
  }
}
