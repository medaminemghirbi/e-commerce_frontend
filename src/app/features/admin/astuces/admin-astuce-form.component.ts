import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AstuceService } from '../../../core/services/astuce.service';
import { ProductService } from '../../../core/services/product.service';
import { Astuce } from '../../../core/models/astuce.model';
import { Product } from '../../../core/models/product.model';

const CATEGORIES = ['Général', 'Nutrition', 'Sport & Rééducation', 'Soins', 'Diabète', 'Cardiologie'];

@Component({
  selector: 'app-admin-astuce-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-2xl space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/admin/astuces" class="w-9 h-9 flex items-center justify-center rounded-xl" style="border:1px solid var(--border)">
          <svg class="w-4 h-4" style="color:var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <h1 class="text-2xl font-extrabold" style="color:var(--text-primary)">
          {{ isEdit() ? "✏️ Modifier l'astuce" : '➕ Nouvelle astuce' }}
        </h1>
      </div>

      <form (ngSubmit)="save()" class="space-y-5">

        <!-- Images -->
        <div class="card p-6 space-y-4">
          <h2 class="font-bold" style="color:var(--text-primary)">🖼️ Images</h2>

          <!-- Existing images -->
          @if (form.images?.length) {
            <div class="flex gap-3 flex-wrap">
              @for (img of form.images!; track img; let i = $index) {
                <div class="relative group">
                  <img [src]="img" class="w-24 h-24 object-cover rounded-xl" style="border:1px solid var(--border)" />
                  <button type="button" (click)="removeImage(i)"
                    class="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold"
                    style="background:#dc2626">✕</button>
                </div>
              }
            </div>
          }

          <!-- Upload button -->
          <label class="flex items-center gap-2 w-fit px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-colors"
            style="background:var(--primary-light);color:var(--primary);border:1.5px solid var(--primary)"
            [class.opacity-50]="uploading()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            {{ uploading() ? 'Envoi…' : 'Ajouter une image' }}
            <input type="file" accept="image/*" class="hidden" [disabled]="uploading()" (change)="onFilePicked($event)" />
          </label>
          <p class="text-xs" style="color:var(--text-secondary)">PNG, JPG, WebP — max 5 Mo. Plusieurs images possibles.</p>
        </div>

        <!-- Info -->
        <div class="card p-6 space-y-4">
          <h2 class="font-bold" style="color:var(--text-primary)">📝 Informations</h2>

          <div class="form-field">
            <label class="form-label">Titre *</label>
            <input [(ngModel)]="form.title" name="title" type="text" class="form-input"
              placeholder="ex: 5 astuces pour mieux gérer le diabète" />
          </div>

          <div class="form-field">
            <label class="form-label">Description</label>
            <textarea [(ngModel)]="form.description" name="description" rows="5"
              class="form-input resize-none"
              placeholder="Contenu détaillé de l'astuce…"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-field">
              <label class="form-label">Catégorie</label>
              <select [(ngModel)]="form.category" name="category" class="form-input">
                @for (cat of categories; track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            </div>
            <div class="form-field">
              <label class="form-label">Ordre d'affichage</label>
              <input [(ngModel)]="form.sort_order" name="sort_order" type="number" class="form-input" min="0" />
            </div>
          </div>

          <div class="form-field">
            <label class="form-label">Produit lié (optionnel)</label>

            <!-- Selected product display -->
            @if (selectedProduct()) {
              <div class="flex items-center gap-3 p-3 rounded-xl mb-2" style="background:var(--primary-light);border:1px solid var(--primary)">
                @if (selectedProduct()!.images[0]) {
                  <img [src]="selectedProduct()!.images[0]" class="w-10 h-10 rounded-lg object-cover shrink-0" />
                }
                <span class="text-sm font-semibold flex-1" style="color:var(--text-primary)">{{ selectedProduct()!.name_fr }}</span>
                <button type="button" (click)="form.product_id = null; productSearch = ''"
                  class="text-xs font-bold px-2 py-1 rounded-lg" style="color:#dc2626;background:rgba(220,38,38,0.1)">✕ Retirer</button>
              </div>
            }

            <!-- Search input -->
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
              <input
                type="text"
                [(ngModel)]="productSearch"
                name="product_search"
                class="form-input pl-9"
                placeholder="Rechercher un produit…"
                (focus)="showProductList.set(true)"
              />
            </div>

            <!-- Dropdown list -->
            @if (showProductList() && filteredProducts().length > 0) {
              <div class="mt-1 rounded-xl overflow-hidden border max-h-52 overflow-y-auto z-10 relative"
                style="border-color:var(--border);background:var(--bg-card);box-shadow:0 8px 24px rgba(0,0,0,0.12)">
                <!-- None option -->
                <button type="button"
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:opacity-80"
                  style="color:var(--text-secondary)"
                  (click)="selectProduct(null)">
                  — Aucun produit —
                </button>
                @for (p of filteredProducts(); track p.id) {
                  <button type="button"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left border-t transition-colors"
                    style="border-color:var(--border)"
                    [style.background]="form.product_id === p.id ? 'var(--primary-light)' : 'transparent'"
                    (click)="selectProduct(p)">
                    @if (p.images[0]) {
                      <img [src]="p.images[0]" class="w-8 h-8 rounded-lg object-cover shrink-0" />
                    } @else {
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style="background:var(--bg-secondary)">💊</div>
                    }
                    <span style="color:var(--text-primary)">{{ p.name_fr }}</span>
                  </button>
                }
              </div>
            }
          </div>

          <div class="flex items-center gap-3">
            <input [(ngModel)]="form.active" name="active" type="checkbox" id="astuce-active" class="w-4 h-4" />
            <label for="astuce-active" class="text-sm font-medium" style="color:var(--text-primary)">Visible sur le site</label>
          </div>
        </div>

        @if (error()) {
          <p class="text-sm text-red-500">{{ error() }}</p>
        }

        <div class="flex gap-3">
          <button type="submit" [disabled]="saving() || uploading()"
            class="btn-primary py-3 px-8 flex items-center gap-2"
            [class.opacity-60]="saving() || uploading()">
            @if (saving()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            }
            {{ isEdit() ? '💾 Sauvegarder' : "✅ Créer l'astuce" }}
          </button>
          <a routerLink="/admin/astuces" class="btn-secondary py-3 px-8">Annuler</a>
        </div>

      </form>
    </div>
  `,
})
export class AdminAstuceFormComponent implements OnInit {
  private astuceSvc  = inject(AstuceService);
  private productSvc = inject(ProductService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);

  protected isEdit         = signal(false);
  protected saving         = signal(false);
  protected uploading      = signal(false);
  protected error          = signal('');
  protected categories     = CATEGORIES;
  protected products       = signal<Product[]>([]);
  protected showProductList = signal(false);
  protected productSearch  = '';

  protected filteredProducts = computed(() => {
    const q = this.productSearch.trim().toLowerCase();
    return q ? this.products().filter(p => p.name_fr?.toLowerCase().includes(q)) : this.products();
  });

  protected selectedProduct = computed(() =>
    this.products().find(p => p.id === this.form.product_id) ?? null
  );

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.form-field')) this.showProductList.set(false);
  }

  selectProduct(p: Product | null): void {
    this.form.product_id = p?.id != null ? +p.id : null;
    this.productSearch   = '';
    this.showProductList.set(false);
  }

  protected form: Partial<Astuce> = {
    title: '', description: '', images: [], category: 'Général', sort_order: 0, active: true, product_id: null
  };

  private editId: number | null = null;

  ngOnInit(): void {
    this.productSvc.getAllAdmin().subscribe(list => this.products.set(list));
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.editId = +id;
      this.astuceSvc.adminGetById(id).subscribe(a => { this.form = { ...a }; });
    }
  }

  async onFilePicked(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.error.set('Image trop grande (max 5 Mo).'); return; }
    this.uploading.set(true);
    this.error.set('');
    try {
      const url = await this.astuceSvc.uploadImage(file);
      this.form.images = [...(this.form.images ?? []), url];
    } catch { this.error.set('Erreur lors de l\'upload.'); }
    finally { this.uploading.set(false); }
  }

  removeImage(index: number): void {
    this.form.images = this.form.images!.filter((_, i) => i !== index);
  }

  save(): void {
    if (!this.form.title?.trim()) { this.error.set('Le titre est obligatoire.'); return; }
    this.saving.set(true);
    this.error.set('');
    const payload = { ...this.form, product_id: this.form.product_id || null };
    const req = this.editId
      ? this.astuceSvc.update(this.editId, payload)
      : this.astuceSvc.create(payload);
    req.subscribe({
      next: () => this.router.navigate(['/admin/astuces']),
      error: e  => { this.saving.set(false); this.error.set(e.error?.error ?? 'Erreur.'); },
    });
  }
}
