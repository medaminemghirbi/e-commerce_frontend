import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MarqueService } from '../../../core/services/marque.service';
import { ProductService } from '../../../core/services/product.service';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SeoService } from '../../../core/services/seo.service';
import { Marque } from '../../../core/models/marque.model';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-marque-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, ProductCardComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <!-- Breadcrumb -->
      <nav class="flex items-center gap-1.5 text-sm mb-8" style="color: var(--text-secondary)">
        <a routerLink="/" class="hover:text-sky-500 transition-colors">Accueil</a>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <a routerLink="/products" class="hover:text-sky-500 transition-colors">Catalogue</a>
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span style="color:var(--text-primary)" class="font-medium">{{ marque()?.name ?? '…' }}</span>
      </nav>

      @if (loading()) {
        <!-- Skeleton header -->
        <div class="flex items-center gap-6 mb-12">
          <div class="skeleton w-28 h-28 rounded-2xl"></div>
          <div class="space-y-3 flex-1">
            <div class="skeleton h-7 w-48 rounded"></div>
            <div class="skeleton h-4 w-96 rounded"></div>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          @for (i of skeletons; track i) {
            <div class="card overflow-hidden animate-pulse">
              <div class="skeleton h-52 w-full"></div>
              <div class="p-4 space-y-3">
                <div class="skeleton h-4 w-3/4 rounded"></div>
                <div class="skeleton h-4 w-1/2 rounded"></div>
                <div class="skeleton h-9 rounded-xl"></div>
              </div>
            </div>
          }
        </div>

      } @else if (marque()) {

        <!-- ── Brand Header ─────────────────────────────── -->
        <div class="card p-8 mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          @if (marque()!.image) {
            <div class="w-32 h-32 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center p-3"
              style="background:var(--bg-secondary);border:1px solid var(--border)">
              <img [src]="marque()!.image" [alt]="marque()!.name"
                class="max-w-full max-h-full object-contain" />
            </div>
          } @else {
            <div class="w-32 h-32 rounded-2xl flex items-center justify-center text-5xl shrink-0"
              style="background:var(--bg-secondary);border:1px solid var(--border)">
              🎯
            </div>
          }
          <div class="flex-1 text-center sm:text-left">
            <h1 class="text-3xl font-extrabold mb-2" style="color:var(--text-primary)">
              {{ marque()!.name }}
            </h1>
            @if (marque()!.description) {
              <p class="text-base leading-relaxed mb-4" style="color:var(--text-secondary)">
                {{ marque()!.description }}
              </p>
            }
            <span class="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full"
              style="background:var(--primary-light);color:var(--primary)">
              {{ products().length }} produit{{ products().length > 1 ? 's' : '' }}
            </span>
          </div>
        </div>

        <!-- ── Products Grid ──────────────────────────────── -->
        @if (products().length) {
          <h2 class="text-xl font-bold mb-5" style="color:var(--text-primary)">
            Produits {{ marque()!.name }}
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            @for (p of products(); track p.id) {
              <app-product-card [product]="p" />
            }
          </div>
        } @else {
          <div class="card p-16 text-center">
            <div class="text-5xl mb-4">📦</div>
            <p class="font-semibold text-lg mb-1" style="color:var(--text-primary)">Aucun produit pour cette marque</p>
            <p class="text-sm mb-5" style="color:var(--text-secondary)">Les produits de cette marque seront disponibles prochainement.</p>
            <a routerLink="/products" class="btn-primary">Voir le catalogue</a>
          </div>
        }

      } @else {
        <div class="card p-16 text-center">
          <p style="color:var(--text-secondary)">Marque introuvable.</p>
          <a routerLink="/products" class="btn-primary mt-4">Retour au catalogue</a>
        </div>
      }
    </div>
  `,
})
export class MarqueDetailComponent implements OnInit {
  private marquesSvc  = inject(MarqueService);
  private productsSvc = inject(ProductService);
  private route       = inject(ActivatedRoute);
  private seo         = inject(SeoService);

  protected marque   = signal<Marque | null>(null);
  protected products = signal<Product[]>([]);
  protected loading  = signal(true);
  protected skeletons = Array(8).fill(0);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }

    const [m, prods] = await Promise.all([
      this.marquesSvc.getById(id),
      this.productsSvc.getByMarque(id).toPromise().then(r => r ?? []),
    ]);

    this.marque.set(m);
    this.products.set(prods);

    if (m) {
      this.seo.set({
        title: m.name,
        description: m.description ?? `Découvrez tous les produits ${m.name} disponibles sur MedicareInaya.`,
        image: m.image,
      });
    }

    this.loading.set(false);
  }
}
