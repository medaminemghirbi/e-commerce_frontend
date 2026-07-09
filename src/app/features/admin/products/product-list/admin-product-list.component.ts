import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, switchMap, tap, debounceTime, distinctUntilChanged } from 'rxjs';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { SubcategoryService } from '../../../../core/services/subcategory.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ProgressService } from '../../../../core/services/progress.service';
import Swal from 'sweetalert2';
import { Product } from '../../../../core/models/product.model';
import { Subcategory } from '../../../../core/models/subcategory.model';
import * as XLSX from 'xlsx';
import { CouponService } from '../../../../core/services/coupon.service';
import { Coupon } from '../../../../core/models/coupon.model';

const PER_PAGE = 15;

interface PageParams {
  page: number;
  q: string;
  category_id: string;
  status: string;
}

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h1 class="text-2xl font-extrabold flex items-center gap-3" style="color: var(--text-primary)">
          {{ 'ADMIN.PRODUCTS.TITLE' | translate }}
          <span class="text-sm font-semibold px-2.5 py-0.5 rounded-full" style="background: var(--primary-light); color: var(--primary)">
            {{ meta()?.total_count ?? '…' }} produits
          </span>
        </h1>
        <div class="flex items-center gap-2 flex-wrap">
          <button (click)="downloadTemplate()" class="btn-secondary text-sm gap-2">📥 Modèle Excel</button>
          <button (click)="fileInput.click()" [disabled]="importing()" class="btn-secondary text-sm gap-2">
            @if (importing()) { ⏳ Import... } @else { 📂 Importer Excel }
          </button>
          <input #fileInput type="file" accept=".xlsx,.xls,.csv" class="hidden" (change)="onFileSelected($event)" />
          <button (click)="deleteAll()" [disabled]="deletingAll()" class="text-sm px-4 py-2 rounded-xl font-medium transition-colors" style="background:#fee2e2;color:#dc2626">
            @if (deletingAll()) { ⏳ Suppression... } @else { 🗑️ Tout supprimer }
          </button>
          <a routerLink="/admin/products/new" class="btn-primary text-sm gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            {{ 'ADMIN.PRODUCTS.ADD' | translate }}
          </a>
        </div>
      </div>

      <!-- Filters -->
      <div class="card p-4 flex flex-wrap gap-4">
        <input type="text" [ngModel]="searchInput()" (ngModelChange)="onSearch($event)"
          [placeholder]="'SEARCH.PLACEHOLDER' | translate" class="form-input flex-1 min-w-48" />
        <select [ngModel]="params().category_id" (ngModelChange)="onCatFilter($event)" class="form-input w-auto">
          <option value="">{{ 'PRODUCTS.ALL_CATEGORIES' | translate }}</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.name_fr }}</option>
          }
        </select>
        <select [ngModel]="params().status" (ngModelChange)="onStatusFilter($event)" class="form-input w-auto">
          <option value="">{{ 'PRODUCT.ALL_STATUS' | translate }}</option>
          <option value="active">{{ 'PRODUCT.ACTIVE' | translate }}</option>
          <option value="inactive">{{ 'PRODUCT.INACTIVE' | translate }}</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ 'PRODUCT.IMAGE' | translate }}</th>
                <th>{{ 'PRODUCT.NAME' | translate }}</th>
                <th>{{ 'PRODUCT.CATEGORY' | translate }}</th>
                <th>Marque</th>
                <th>Code à barre</th>
                <th>Mots-clés</th>
                <th>Sous-catégories</th>
                <th>{{ 'PRODUCT.PRICE' | translate }}</th>
                <th>{{ 'PRODUCT.STOCK' | translate }}</th>
                <th>{{ 'PRODUCT.STATUS' | translate }}</th>
                <th>{{ 'ADMIN.ACTIONS' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @if (loading()) {
                @for (i of skeletonRows; track i) {
                  <tr class="animate-pulse">
                    <td><div class="w-12 h-12 rounded-lg skeleton"></div></td>
                    <td><div class="h-4 rounded skeleton w-36"></div></td>
                    <td><div class="h-5 rounded-full skeleton w-20"></div></td>
                    <td><div class="flex items-center gap-2"><div class="w-8 h-8 rounded-lg skeleton"></div><div class="h-4 rounded skeleton w-20"></div></div></td>
                    <td><div class="h-4 rounded skeleton w-24"></div></td>
                    <td><div class="flex gap-1"><div class="h-5 rounded-full skeleton w-14"></div><div class="h-5 rounded-full skeleton w-10"></div></div></td>
                    <td><div class="flex gap-1"><div class="h-5 rounded-full skeleton w-16"></div><div class="h-5 rounded-full skeleton w-12"></div></div></td>
                    <td><div class="h-4 rounded skeleton w-16"></div></td>
                    <td><div class="h-5 rounded-full skeleton w-10"></div></td>
                    <td><div class="h-5 rounded-full skeleton w-14"></div></td>
                    <td><div class="flex gap-2"><div class="h-7 rounded-lg skeleton w-14"></div><div class="h-7 rounded-lg skeleton w-14"></div></div></td>
                  </tr>
                }
              } @else {
                @for (p of products(); track p.id) {
                  <tr (click)="openPanel(p)" class="cursor-pointer transition-colors"
                    [style.background]="selectedProduct()?.id === p.id ? 'var(--primary-light)' : ''">
                    <td>
                      @if (p.images.length) {
                        <img [src]="p.images[0]" class="w-12 h-12 rounded-lg object-cover" />
                      } @else {
                        <div class="w-12 h-12 rounded-lg img-placeholder">
                          <svg class="w-5 h-5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        </div>
                      }
                    </td>
                    <td><div class="font-medium" style="color: var(--text-primary)">{{ p.name_fr }}</div></td>
                    <td><span class="badge badge-primary">{{ getCatName(p.category_id) }}</span></td>
                    <td>
                      @if (p.marque) {
                        <a [routerLink]="['/admin/marques', p.marque.id, 'edit']" (click)="$event.stopPropagation()"
                          class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          @if (p.marque.image) {
                            <img [src]="p.marque.image" class="w-8 h-8 rounded-lg object-contain border" style="border-color:var(--border)" />
                          } @else {
                            <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style="background:var(--bg-secondary)">🎯</div>
                          }
                          <span class="text-sm font-medium" style="color:var(--primary)">{{ p.marque.name }}</span>
                        </a>
                      } @else {
                        <span class="text-xs" style="color:var(--text-secondary)">—</span>
                      }
                    </td>
                    <td>
                      @if (p.barcode) {
                        <span class="font-mono text-xs px-2 py-1 rounded-lg" style="background:var(--bg-secondary);color:var(--text-primary)">🔲 {{ p.barcode }}</span>
                      } @else {
                        <span class="text-xs" style="color:var(--text-secondary)">—</span>
                      }
                    </td>
                    <td>
                      <div class="flex flex-wrap gap-1">
                        @for (kw of (p.keywords ?? []).slice(0, 3); track kw) {
                          <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:var(--primary-light);color:var(--primary)">{{ kw }}</span>
                        }
                        @if ((p.keywords ?? []).length > 3) {
                          <span class="text-xs" style="color:var(--text-secondary)">+{{ (p.keywords ?? []).length - 3 }}</span>
                        }
                        @if (!(p.keywords ?? []).length) {
                          <span class="text-xs" style="color:var(--text-secondary)">—</span>
                        }
                      </div>
                    </td>
                    <td>
                      <div class="flex flex-wrap gap-1">
                        @for (sub of (p.subcategories_detail ?? []).slice(0, 2); track sub.id) {
                          <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">{{ sub.icon || '📂' }} {{ sub.name_fr }}</span>
                        }
                        @if ((p.subcategories_detail ?? []).length > 2) {
                          <span class="text-xs" style="color:var(--text-secondary)">+{{ (p.subcategories_detail ?? []).length - 2 }}</span>
                        }
                        @if (!(p.subcategories_detail ?? []).length) {
                          <span class="text-xs" style="color:var(--text-secondary)">—</span>
                        }
                      </div>
                    </td>
                    <td>
                      <div class="font-medium" style="color: var(--text-primary)">{{ p.price | number:'1.0-0' }} TND</div>
                      @if (p.has_promotion) {
                        <div class="text-xs" style="color: var(--success)">-{{ p.promotion_discount }}% 🎉</div>
                      }
                    </td>
                    <td>
                      <span [class]="p.stock_quantity <= 2 ? 'badge badge-danger' : 'badge badge-success'">{{ p.stock_quantity }}</span>
                    </td>
                    <td>
                      <span [class]="p.status === 'active' ? 'badge badge-success' : 'badge'">{{ p.status }}</span>
                    </td>
                    <td>
                      <div class="flex items-center gap-2" (click)="$event.stopPropagation()">
                        <a [routerLink]="['/admin/products', p.id, 'edit']" class="btn-secondary py-1.5 px-3 text-xs">
                          {{ 'ADMIN.EDIT' | translate }}
                        </a>
                        <button (click)="delete(p)" class="px-3 py-1.5 rounded-lg text-xs font-medium" style="background: #fee2e2; color: #dc2626">
                          {{ 'ADMIN.DELETE' | translate }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (!loading() && !products().length) {
            <div class="text-center py-12" style="color: var(--text-secondary)">
              {{ 'ADMIN.PRODUCTS.EMPTY' | translate }}
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (!loading() && totalPages() > 1) {
          <div class="flex items-center justify-between px-4 py-3 border-t flex-wrap gap-3" style="border-color:var(--border)">
            <span class="text-sm" style="color:var(--text-secondary)">
              Page <strong style="color:var(--text-primary)">{{ params().page }}</strong>
              sur <strong style="color:var(--text-primary)">{{ totalPages() }}</strong>
              — <strong style="color:var(--text-primary)">{{ meta()?.total_count }}</strong> produits
            </span>
            <div class="flex items-center gap-1">
              <button (click)="goToPage(params().page - 1)" [disabled]="params().page === 1"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style="background:var(--bg-secondary);color:var(--text-primary)">← Préc.</button>
              @for (pg of pageNumbers(); track pg) {
                @if (pg === -1) {
                  <span class="px-2 text-sm" style="color:var(--text-secondary)">…</span>
                } @else {
                  <button (click)="goToPage(pg)"
                    class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                    [style.background]="params().page === pg ? 'var(--primary)' : 'var(--bg-secondary)'"
                    [style.color]="params().page === pg ? '#fff' : 'var(--text-primary)'">{{ pg }}</button>
                }
              }
              <button (click)="goToPage(params().page + 1)" [disabled]="params().page === totalPages()"
                class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style="background:var(--bg-secondary);color:var(--text-primary)">Suiv. →</button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- ── Backdrop ─────────────────────────────────────────────── -->
    @if (selectedProduct()) {
      <div class="fixed inset-0 bg-black/30 z-40 transition-opacity"
        (click)="closePanel()">
      </div>
    }

    <!-- ── Detail Panel (resizable drawer) ──────────────────────── -->
    @if (selectedProduct()) {
      <div class="fixed top-0 right-0 bottom-0 z-50 flex shadow-2xl"
        [style.width.px]="panelWidth()">

        <!-- Drag handle -->
        <div
          (mousedown)="startResize($event)"
          class="w-1.5 shrink-0 hover:bg-sky-400 transition-colors cursor-col-resize"
          style="background:var(--border)">
        </div>

        <!-- Panel content -->
        <div class="flex-1 flex flex-col overflow-hidden" style="background:var(--bg-card)">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b shrink-0" style="border-color:var(--border)">
            <h2 class="font-bold text-base truncate pr-4" style="color:var(--text-primary)">
              {{ selectedProduct()!.name_fr }}
            </h2>
            <button (click)="closePanel()"
              class="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity shrink-0"
              style="background:var(--bg-secondary);color:var(--text-secondary)">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Scrollable body -->
          <div class="flex-1 overflow-y-auto">

            <!-- ── Images ─────────────────────────────────── -->
            @if (selectedProduct()!.images.length) {
              <div class="p-4 border-b" style="border-color:var(--border)">
                <div class="rounded-xl overflow-hidden mb-2" style="height:220px;background:var(--bg-secondary);border:1px solid var(--border)">
                  <img [src]="selectedProduct()!.images[previewImg()]" class="w-full h-full object-contain" />
                </div>
                @if (selectedProduct()!.images.length > 1) {
                  <div class="flex gap-2 overflow-x-auto pb-1">
                    @for (img of selectedProduct()!.images; track img; let i = $index) {
                      <button (click)="previewImg.set(i)"
                        class="w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all"
                        [style.border-color]="previewImg() === i ? 'var(--primary)' : 'var(--border)'">
                        <img [src]="img" class="w-full h-full object-cover" />
                      </button>
                    }
                  </div>
                }
                <p class="text-xs mt-1.5 text-right" style="color:var(--text-secondary)">{{ selectedProduct()!.images.length }} image(s)</p>
              </div>
            } @else {
              <div class="flex items-center justify-center border-b" style="height:140px;background:var(--bg-secondary);border-color:var(--border)">
                <svg class="w-14 h-14 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
            }

            <!-- ── Identité ─────────────────────────────── -->
            <div class="p-4 border-b space-y-3" style="border-color:var(--border)">
              <p class="text-xs font-bold uppercase tracking-widest" style="color:var(--text-secondary)">Identité</p>

              <div class="flex items-center justify-between">
                <span class="text-xs" style="color:var(--text-secondary)">ID</span>
                <span class="font-mono text-xs font-medium px-2 py-0.5 rounded" style="background:var(--bg-secondary);color:var(--text-primary)">#{{ selectedProduct()!.id }}</span>
              </div>

              <div class="flex items-center justify-between">
                <span class="text-xs" style="color:var(--text-secondary)">Statut</span>
                <span [class]="selectedProduct()!.status === 'active' ? 'badge badge-success' : 'badge'">{{ selectedProduct()!.status }}</span>
              </div>

              @if (selectedProduct()!.created_at) {
                <div class="flex items-center justify-between">
                  <span class="text-xs" style="color:var(--text-secondary)">Créé le</span>
                  <span class="text-xs font-medium" style="color:var(--text-primary)">{{ selectedProduct()!.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              }
              @if (selectedProduct()!.updated_at) {
                <div class="flex items-center justify-between">
                  <span class="text-xs" style="color:var(--text-secondary)">Modifié le</span>
                  <span class="text-xs font-medium" style="color:var(--text-primary)">{{ selectedProduct()!.updated_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              }
            </div>

            <!-- ── Marque ──────────────────────────────── -->
            @if (selectedProduct()!.marque) {
              <div class="p-4 border-b" style="border-color:var(--border)">
                <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color:var(--text-secondary)">Marque</p>
                <a [routerLink]="['/admin/marques', selectedProduct()!.marque!.id, 'edit']"
                  class="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition-opacity"
                  style="background:var(--bg-secondary);border:1px solid var(--border)">
                  @if (selectedProduct()!.marque!.image) {
                    <img [src]="selectedProduct()!.marque!.image" class="w-12 h-12 rounded-xl object-contain p-1" style="border:1px solid var(--border);background:var(--bg)" />
                  } @else {
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style="background:var(--bg)">🎯</div>
                  }
                  <div class="flex-1">
                    <p class="font-semibold text-sm" style="color:var(--text-primary)">{{ selectedProduct()!.marque!.name }}</p>
                    <p class="text-xs mt-0.5" style="color:var(--primary)">Modifier la marque →</p>
                  </div>
                </a>
              </div>
            }

            <!-- ── Catégorie & Sous-catégories ─────────── -->
            <div class="p-4 border-b space-y-3" style="border-color:var(--border)">
              <p class="text-xs font-bold uppercase tracking-widest" style="color:var(--text-secondary)">Catégorie</p>
              <div class="flex items-center gap-2 p-3 rounded-xl" style="background:var(--bg-secondary);border:1px solid var(--border)">
                <span class="text-xl">{{ selectedProduct()!.category?.icon || '🏷️' }}</span>
                <span class="font-semibold text-sm" style="color:var(--text-primary)">{{ getCatName(selectedProduct()!.category_id) }}</span>
              </div>

              @if ((selectedProduct()!.subcategories_detail ?? []).length) {
                <p class="text-xs font-bold uppercase tracking-widest mt-2" style="color:var(--text-secondary)">Sous-catégories</p>
                <div class="flex flex-wrap gap-2">
                  @for (sub of selectedProduct()!.subcategories_detail!; track sub.id) {
                    <span class="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium"
                      style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
                      {{ sub.icon || '📂' }} {{ sub.name_fr }}
                    </span>
                  }
                </div>
              }
            </div>

            <!-- ── Prix & Stock ────────────────────────── -->
            <div class="p-4 border-b space-y-3" style="border-color:var(--border)">
              <p class="text-xs font-bold uppercase tracking-widest" style="color:var(--text-secondary)">Prix & Stock</p>

              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-xl text-center" style="background:var(--bg-secondary);border:1px solid var(--border)">
                  <p class="text-xs mb-1" style="color:var(--text-secondary)">Prix</p>
                  <p class="text-lg font-extrabold" style="color:var(--primary)">{{ selectedProduct()!.price | number:'1.2-2' }}</p>
                  <p class="text-xs" style="color:var(--text-secondary)">TND</p>
                </div>
                <div class="p-3 rounded-xl text-center" style="background:var(--bg-secondary);border:1px solid var(--border)">
                  <p class="text-xs mb-1" style="color:var(--text-secondary)">Stock</p>
                  <p class="text-lg font-extrabold"
                    [style.color]="selectedProduct()!.stock_quantity === 0 ? '#ef4444' : selectedProduct()!.stock_quantity <= 2 ? '#f59e0b' : 'var(--success)'">
                    {{ selectedProduct()!.stock_quantity }}
                  </p>
                  <p class="text-xs" style="color:var(--text-secondary)">unités</p>
                </div>
              </div>

              @if (selectedProduct()!.has_promotion) {
                <div class="p-3 rounded-xl" style="background:#fef3c7;border:1px solid #fde68a">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-semibold" style="color:#92400e">🎉 Promotion active</span>
                    <span class="badge badge-danger">-{{ selectedProduct()!.promotion_discount }}%</span>
                  </div>
                  <p class="text-sm font-bold" style="color:#92400e">
                    Prix promo : {{ (selectedProduct()!.price * (1 - (selectedProduct()!.promotion_discount ?? 0) / 100)) | number:'1.2-2' }} TND
                  </p>
                </div>
              }
            </div>

            <!-- ── Coupons applicables ───────────────── -->
            @if (activeCoupons().length) {
              <div class="p-4 border-b space-y-2" style="border-color:var(--border)">
                <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color:var(--text-secondary)">
                  🎟️ Coupons actifs ({{ activeCoupons().length }})
                </p>
                @for (c of activeCoupons(); track c.id) {
                  <div class="flex items-center justify-between p-2.5 rounded-lg"
                    style="background:var(--bg-secondary);border:1px solid var(--border)">
                    <div class="flex flex-col gap-0.5">
                      <span class="font-mono font-bold text-xs px-2 py-0.5 rounded self-start"
                        style="background:var(--primary-light);color:var(--primary)">
                        {{ c.code }}
                      </span>
                      <span class="text-xs" style="color:var(--text-secondary)">
                        @if (c.discount_type === 'percentage') { -{{ c.discount_value }}% sur commande }
                        @else { -{{ c.discount_value | number:'1.2-2' }} TND sur commande }
                        @if (c.min_order_amount) { · min {{ c.min_order_amount }} TND }
                      </span>
                    </div>
                    <div class="text-right shrink-0 ml-2">
                      <p class="text-xs font-bold" style="color:#16a34a">
                        → {{ couponPrice(selectedProduct()!.price, c) | number:'1.2-2' }} TND
                      </p>
                      <p class="text-xs" style="color:var(--text-secondary)">prix unitaire</p>
                    </div>
                  </div>
                }
              </div>
            }

            <!-- ── Noms (3 langues) ───────────────────── -->
            <div class="p-4 border-b space-y-2" style="border-color:var(--border)">
              <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color:var(--text-secondary)">Noms</p>
              @if (selectedProduct()!.name_fr) {
                <div class="p-2.5 rounded-lg" style="background:var(--bg-secondary)">
                  <span class="text-xs font-semibold mr-2" style="color:var(--text-secondary)">🇫🇷 FR</span>
                  <span class="text-sm" style="color:var(--text-primary)">{{ selectedProduct()!.name_fr }}</span>
                </div>
              }
              @if (selectedProduct()!.name_ar) {
                <div class="p-2.5 rounded-lg" style="background:var(--bg-secondary)" dir="rtl">
                  <span class="text-xs font-semibold ml-2" style="color:var(--text-secondary)">🇸🇦 AR</span>
                  <span class="text-sm" style="color:var(--text-primary)">{{ selectedProduct()!.name_ar }}</span>
                </div>
              }
              @if (selectedProduct()!.name_en) {
                <div class="p-2.5 rounded-lg" style="background:var(--bg-secondary)">
                  <span class="text-xs font-semibold mr-2" style="color:var(--text-secondary)">🇬🇧 EN</span>
                  <span class="text-sm" style="color:var(--text-primary)">{{ selectedProduct()!.name_en }}</span>
                </div>
              }
            </div>

            <!-- ── Descriptions (3 langues) ──────────── -->
            @if (selectedProduct()!.description_fr || selectedProduct()!.description_ar || selectedProduct()!.description_en) {
              <div class="p-4 border-b space-y-2" style="border-color:var(--border)">
                <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color:var(--text-secondary)">Descriptions</p>
                @if (selectedProduct()!.description_fr) {
                  <div class="p-2.5 rounded-lg" style="background:var(--bg-secondary)">
                    <p class="text-xs font-semibold mb-1" style="color:var(--text-secondary)">🇫🇷 Français</p>
                    <p class="text-sm leading-relaxed" style="color:var(--text-primary)">{{ selectedProduct()!.description_fr }}</p>
                  </div>
                }
                @if (selectedProduct()!.description_ar) {
                  <div class="p-2.5 rounded-lg" style="background:var(--bg-secondary)" dir="rtl">
                    <p class="text-xs font-semibold mb-1" style="color:var(--text-secondary)">🇸🇦 عربي</p>
                    <p class="text-sm leading-relaxed" style="color:var(--text-primary)">{{ selectedProduct()!.description_ar }}</p>
                  </div>
                }
                @if (selectedProduct()!.description_en) {
                  <div class="p-2.5 rounded-lg" style="background:var(--bg-secondary)">
                    <p class="text-xs font-semibold mb-1" style="color:var(--text-secondary)">🇬🇧 English</p>
                    <p class="text-sm leading-relaxed" style="color:var(--text-primary)">{{ selectedProduct()!.description_en }}</p>
                  </div>
                }
              </div>
            }

            <!-- ── Mots-clés ───────────────────────────── -->
            @if ((selectedProduct()!.keywords ?? []).length) {
              <div class="p-4 border-b" style="border-color:var(--border)">
                <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color:var(--text-secondary)">Mots-clés ({{ selectedProduct()!.keywords!.length }})</p>
                <div class="flex flex-wrap gap-1.5">
                  @for (kw of selectedProduct()!.keywords!; track kw) {
                    <span class="text-xs px-2.5 py-1 rounded-full font-medium" style="background:var(--primary-light);color:var(--primary)"># {{ kw }}</span>
                  }
                </div>
              </div>
            }

            <!-- ── Détails produit ─────────────────────── -->
            <div class="p-4 border-b space-y-2.5" style="border-color:var(--border)">
              <p class="text-xs font-bold uppercase tracking-widest mb-3" style="color:var(--text-secondary)">Détails</p>

              @if (selectedProduct()!.barcode) {
                <div class="flex items-center justify-between py-2 border-b" style="border-color:var(--border)">
                  <span class="text-xs" style="color:var(--text-secondary)">🔲 Code à barre</span>
                  <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded" style="background:var(--bg-secondary);color:var(--text-primary)">{{ selectedProduct()!.barcode }}</span>
                </div>
              }

              @if (selectedProduct()!.manufacture_date) {
                <div class="flex items-center justify-between py-2 border-b" style="border-color:var(--border)">
                  <span class="text-xs" style="color:var(--text-secondary)">📅 Date fabrication</span>
                  <span class="text-xs font-medium" style="color:var(--text-primary)">{{ selectedProduct()!.manufacture_date }}</span>
                </div>
              }

              @if (selectedProduct()!.expiration_date) {
                <div class="flex items-center justify-between py-2" style="border-color:var(--border)">
                  <span class="text-xs" style="color:var(--text-secondary)">⏳ Date expiration</span>
                  <span class="text-xs font-medium"
                    [style.color]="isExpiringSoon(selectedProduct()!.expiration_date!) ? '#f59e0b' : 'var(--text-primary)'">
                    {{ selectedProduct()!.expiration_date }}
                    @if (isExpiringSoon(selectedProduct()!.expiration_date!)) { ⚠️ }
                  </span>
                </div>
              }
            </div>

          </div>

          <!-- Footer actions -->
          <div class="shrink-0 p-4 border-t space-y-2" style="border-color:var(--border)">
            <a [routerLink]="['/admin/products', selectedProduct()!.id, 'edit']"
              class="btn-primary w-full justify-center text-sm py-2.5">
              ✏️ Modifier ce produit
            </a>
            <div class="flex gap-2">
              <button (click)="deleteSelected()" class="flex-1 py-2 rounded-xl text-sm font-medium transition-colors" style="background:#fee2e2;color:#dc2626">
                🗑️ Supprimer
              </button>
              <a [routerLink]="['/products', selectedProduct()!.id]" target="_blank"
                class="flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors" style="background:var(--bg-secondary);color:var(--text-primary)">
                👁 Voir site
              </a>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AdminProductListComponent implements OnInit, OnDestroy {
  private productSvc     = inject(ProductService);
  private categorySvc    = inject(CategoryService);
  private subcategorySvc = inject(SubcategoryService);
  private couponSvc      = inject(CouponService);
  private toast          = inject(ToastService);
  private progress       = inject(ProgressService);

  protected activeCoupons = signal<Coupon[]>([]);

  protected loading      = signal(true);
  protected importing    = signal(false);
  protected deletingAll  = signal(false);
  protected skeletonRows = Array(PER_PAGE).fill(0);

  protected searchInput  = signal('');
  protected params       = signal<PageParams>({ page: 1, q: '', category_id: '', status: '' });

  // Detail panel
  protected selectedProduct = signal<Product | null>(null);
  protected previewImg      = signal(0);
  protected panelWidth      = signal(420);

  private params$         = new BehaviorSubject<PageParams>({ page: 1, q: '', category_id: '', status: '' });
  private searchDebounce$ = new BehaviorSubject<string>('');
  private kbHandler       = (e: KeyboardEvent) => { if (e.key === 'Escape') this.closePanel(); };

  private response = toSignal(
    this.params$.pipe(
      tap(() => { this.loading.set(true); this.progress.start(); }),
      switchMap(p => this.productSvc.getAdminPaginated({ page: p.page, per: PER_PAGE, q: p.q, category_id: p.category_id, status: p.status })),
      tap(() => { this.loading.set(false); this.progress.complete(); }),
    ),
    { initialValue: null as any }
  );

  protected products   = computed(() => this.response()?.products ?? []);
  protected meta       = computed(() => this.response()?.meta ?? null);
  protected totalPages = computed(() => this.meta()?.total_pages ?? 1);

  protected pageNumbers = computed(() => {
    const total = this.totalPages(), current = this.params().page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });

  protected categories = toSignal(this.categorySvc.getAll(),    { initialValue: [] });
  protected allSubcats = toSignal(this.subcategorySvc.getAll(), { initialValue: [] as Subcategory[] });

  protected filteredSubcats = computed(() =>
    this.params().category_id
      ? this.allSubcats().filter(s => String(s.category_id) === String(this.params().category_id))
      : []
  );

  ngOnInit(): void {
    this.searchDebounce$.pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(q => this.pushParams({ q, page: 1 }));
    document.addEventListener('keydown', this.kbHandler);
    this.couponSvc.getAll().subscribe(coupons => {
      const now = new Date();
      this.activeCoupons.set(
        coupons.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) > now))
      );
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.kbHandler);
  }

  // ── Panel ────────────────────────────────────────────────────────
  openPanel(p: Product): void {
    this.selectedProduct.set(p);
    this.previewImg.set(0);
  }

  closePanel(): void {
    this.selectedProduct.set(null);
  }

  startResize(e: MouseEvent): void {
    e.preventDefault();
    const startX = e.clientX;
    const startW = this.panelWidth();

    const onMove = (mv: MouseEvent) => {
      const newW = Math.max(320, Math.min(window.innerWidth * 0.75, startW + (startX - mv.clientX)));
      this.panelWidth.set(newW);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  async deleteSelected(): Promise<void> {
    const p = this.selectedProduct();
    if (!p) return;
    await this.delete(p);
    this.closePanel();
  }

  // ── Filters / pagination ─────────────────────────────────────────
  onSearch(q: string): void { this.searchInput.set(q); this.searchDebounce$.next(q); }
  onCatFilter(category_id: string): void { this.pushParams({ category_id, page: 1 }); }
  onStatusFilter(status: string): void { this.pushParams({ status, page: 1 }); }

  goToPage(page: number): void {
    this.pushParams({ page: Math.max(1, Math.min(page, this.totalPages())) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private pushParams(patch: Partial<PageParams>): void {
    const next = { ...this.params(), ...patch };
    this.params.set(next);
    this.params$.next(next);
  }

  getCatName(catId: number | string): string {
    return this.categories().find(c => String(c.id) === String(catId))?.name_fr ?? '—';
  }

  couponPrice(price: number, coupon: Coupon): number {
    if (coupon.discount_type === 'percentage') {
      return Math.max(0, +(price * (1 - coupon.discount_value / 100)).toFixed(2));
    }
    return Math.max(0, +(price - coupon.discount_value).toFixed(2));
  }

  isExpiringSoon(date: string): boolean {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    return days > 0 && days <= 30;
  }

  async delete(p: Product): Promise<void> {
    const result = await Swal.fire({
      title: 'Supprimer ce produit ?',
      html: `<span style="color:#6b7280">Vous allez supprimer <strong>${p.name_fr}</strong>. Cette action est irréversible.</span>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Supprimer', cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await this.productSvc.delete(p.id!);
      this.pushParams({ ...this.params() });
      this.toast.success(`"${p.name_fr}" supprimé.`);
    } catch (e: any) {
      this.toast.error(e.message ?? 'Erreur lors de la suppression.');
    }
  }

  async deleteAll(): Promise<void> {
    const count = this.meta()?.total_count ?? 0;
    const step1 = await Swal.fire({
      title: '⚠️ Suppression totale',
      html: `<p style="color:#6b7280;margin-bottom:8px">Vous allez supprimer <strong style="color:#dc2626">${count} produit(s)</strong>.<br>Cette action est <strong>irréversible</strong>.</p>`,
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Continuer', cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', reverseButtons: true,
    });
    if (!step1.isConfirmed) return;

    const step2 = await Swal.fire({
      title: 'Saisir le code de confirmation',
      html: `<p style="color:#6b7280;font-size:14px;margin-bottom:12px">Tapez <strong>ConfirmedByDev</strong> pour confirmer :</p>`,
      input: 'text', inputPlaceholder: 'Entrez le code ici…',
      inputAttributes: { autocomplete: 'off', spellcheck: 'false' },
      showCancelButton: true,
      confirmButtonText: 'Supprimer tout', cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', reverseButtons: true,
      preConfirm: (code: string) => {
        if (code !== 'ConfirmedByDev') { Swal.showValidationMessage('❌ Code incorrect.'); return false; }
        return true;
      },
    });
    if (!step2.isConfirmed) return;

    this.deletingAll.set(true); this.progress.start();
    try {
      await this.productSvc.deleteAll();
      this.pushParams({ page: 1 });
      this.closePanel();
      this.toast.success('Tous les produits ont été supprimés.');
    } catch (e: any) {
      this.toast.error(e.message ?? 'Erreur lors de la suppression.');
    } finally {
      this.deletingAll.set(false); this.progress.complete();
    }
  }

  downloadTemplate(): void {
    const headers = [['name_fr', 'description_fr', 'category_name', 'price', 'stock_quantity', 'manufacture_date', 'expiration_date', 'status']];
    const example = [
      ['Doliprane 1000mg', 'Antidouleur paracétamol', 'Médicaments', 2.50, 100, '2024-01-01', '2026-12-31', 'active'],
      ['Vitamine C 500mg', 'Complément immunité',     'Compléments',  1.80, 200, '',           '2027-06-30', 'active'],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    ws['!cols'] = [20,30,20,15,15,15,15,10].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    XLSX.writeFile(wb, 'modele-produits.xlsx');
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    (event.target as HTMLInputElement).value = '';
    this.importing.set(true); this.progress.start();
    try {
      const rows = await this.parseFile(file);
      if (!rows.length) throw new Error('Fichier vide ou colonnes incorrectes.');
      const cats = this.categories();
      let inserted = 0;
      const errors: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name_fr = String(row['name_fr'] ?? '').trim();
        if (!name_fr) { errors.push(`Ligne ${i + 2}: name_fr manquant`); continue; }
        const price = parseFloat(row['price'] ?? 0);
        if (isNaN(price) || price <= 0) { errors.push(`Ligne ${i + 2}: prix invalide`); continue; }
        const catName = String(row['category_name'] ?? '').trim();
        const cat = cats.find(c => c.name_fr.toLowerCase() === catName.toLowerCase());
        const product: Partial<Product> = {
          name_fr, description_fr: String(row['description_fr'] ?? '').trim(),
          category_id: cat?.id ?? undefined, price,
          stock_quantity: parseInt(row['stock_quantity'] ?? 0),
          manufacture_date: this.parseDate(row['manufacture_date']),
          expiration_date: this.parseDate(row['expiration_date']),
          status: row['status'] === 'inactive' ? 'inactive' : 'active', images: [],
        };
        try { await this.productSvc.add(product as Product); inserted++; }
        catch (e: any) { errors.push(`Ligne ${i + 2}: ${e.message}`); }
      }
      if (inserted > 0) { this.pushParams({ page: 1 }); this.toast.success(`${inserted} produit(s) importé(s).`); }
      if (errors.length) this.toast.error(`${errors.length} erreur(s): ${errors.slice(0, 3).join(' | ')}${errors.length > 3 ? '…' : ''}`);
    } catch (e: any) {
      this.toast.error(e.message ?? 'Erreur lors de l\'import.');
    } finally {
      this.importing.set(false); this.progress.complete();
    }
  }

  private parseFile(file: File): Promise<Record<string, any>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array', cellDates: false });
          const ws = wb.Sheets[wb.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '', raw: true }));
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private parseDate(value: any): string | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') {
      const ms = Math.round((value - 25569) * 86400 * 1000);
      const d = new Date(ms);
      if (isNaN(d.getTime())) return undefined;
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
    }
    const str = String(value).trim();
    if (!str) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const dmy = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
    return undefined;
  }
}
