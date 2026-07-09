import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { SubcategoryService } from '../../../../core/services/subcategory.service';
import { MarqueService } from '../../../../core/services/marque.service';
import { Marque } from '../../../../core/models/marque.model';
import { Product } from '../../../../core/models/product.model';
import { Subcategory } from '../../../../core/models/subcategory.model';

const STEPS = [
  { n: 1, label: 'Identification', icon: '🪪' },
  { n: 2, label: 'Description',    icon: '📝' },
  { n: 3, label: 'Prix & Stock',   icon: '💰' },
  { n: 4, label: 'Images',         icon: '🖼️' },
  { n: 5, label: 'Options',        icon: '⚙️' },
];

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  styles: [`
    @keyframes scan-move {
      0%   { top: 8%; }
      50%  { top: 82%; }
      100% { top: 8%; }
    }
    .scan-beam {
      position: absolute;
      left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #22c55e, #008000, #22c55e, transparent);
      animation: scan-move 1.8s ease-in-out infinite;
      box-shadow: 0 0 8px rgba(0,128,0,0.8);
    }
  `],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-40" style="background:rgba(15,23,42,0.6);backdrop-filter:blur(4px)"></div>

    <!-- ════════════════════════════════════════════════════════ -->
    <!-- SCANNER OVERLAY                                         -->
    <!-- ════════════════════════════════════════════════════════ -->
    @if (scanning()) {
      <div class="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.88)">
        <div class="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
          style="background:var(--bg-card)">

          <!-- Scanner header -->
          <div class="flex items-center justify-between px-5 py-4"
            style="border-bottom:1px solid var(--border)">
            <div>
              <h3 class="font-bold" style="color:var(--text-primary)">📷 Scanner le code</h3>
              <p class="text-xs mt-0.5" style="color:var(--text-secondary)">
                Pointez la caméra vers le code barre ou QR code
              </p>
            </div>
            <button type="button" (click)="closeScanner()"
              class="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors hover:bg-slate-100"
              style="border:1px solid var(--border);color:var(--text-secondary)">✕</button>
          </div>

          <!-- Video feed -->
          <div class="relative bg-black" style="aspect-ratio:4/3">
            @if (!scannerError()) {
              <video id="barcode-scanner-video" autoplay playsinline muted
                class="w-full h-full object-cover"></video>

              <!-- Scan guide overlay -->
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <!-- Dark vignette -->
                <div class="absolute inset-0"
                  style="background: radial-gradient(ellipse 60% 45% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)"></div>

                <!-- Corner frame -->
                <div class="relative z-10" style="width:220px;height:110px">
                  <div class="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-green-500 rounded-tl-lg"></div>
                  <div class="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-green-500 rounded-tr-lg"></div>
                  <div class="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-green-500 rounded-bl-lg"></div>
                  <div class="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-green-500 rounded-br-lg"></div>
                  <div class="scan-beam"></div>
                </div>
              </div>
            } @else {
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <span class="text-4xl">📷</span>
                <p class="font-semibold text-white">Caméra non disponible</p>
                <p class="text-sm text-slate-400">{{ scannerError() }}</p>
              </div>
            }
          </div>

          <!-- Scanner footer -->
          <div class="px-5 py-4 text-center">
            <p class="text-xs" style="color:var(--text-secondary)">
              Formats supportés : EAN-8 · EAN-13 · QR Code · Code 128 · UPC
            </p>
            @if (scannedValue()) {
              <div class="mt-3 px-4 py-2 rounded-xl font-mono font-bold text-sm"
                style="background:var(--primary-light);color:var(--primary)">
                ✓ {{ scannedValue() }}
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- ════════════════════════════════════════════════════════ -->
    <!-- WIZARD MODAL                                            -->
    <!-- ════════════════════════════════════════════════════════ -->
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <form (ngSubmit)="save()"
        class="w-full max-w-3xl flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style="background:var(--bg-card);max-height:95vh">

        <!-- ══ HEADER ══════════════════════════════════════════ -->
        <div class="shrink-0" style="border-bottom:2px solid var(--border)">
          <div class="flex items-center justify-between px-6 sm:px-8 pt-5 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style="background:var(--primary-light)">💊</div>
              <div>
                <h1 class="font-extrabold text-base leading-tight" style="color:var(--text-primary)">
                  {{ isEdit() ? ('ADMIN.PRODUCTS.EDIT' | translate) : ('ADMIN.PRODUCTS.ADD' | translate) }}
                </h1>
                <p class="text-xs mt-0.5" style="color:var(--text-secondary)">
                  Étape {{ step() }} sur {{ STEPS.length }} — {{ STEPS[step()-1].label }}
                </p>
              </div>
            </div>
            <a routerLink="/admin/products"
              class="w-8 h-8 rounded-xl flex items-center justify-center font-bold transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
              style="border:1px solid var(--border);color:var(--text-secondary)">✕</a>
          </div>

          <!-- Stepper (desktop) -->
          <div class="hidden sm:flex items-center px-8 pb-5">
            @for (s of STEPS; track s.n; let last = $last) {
              <button type="button" (click)="goTo(s.n)" class="flex flex-col items-center gap-1.5 shrink-0">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  [style.background]="step() > s.n ? 'var(--primary)' : step() === s.n ? 'var(--primary)' : 'var(--bg-secondary)'"
                  [style.color]="step() >= s.n ? 'white' : 'var(--text-secondary)'"
                  [style.box-shadow]="step() === s.n ? '0 0 0 4px var(--primary-light)' : 'none'">
                  @if (step() > s.n) { ✓ } @else { {{ s.n }} }
                </div>
                <span class="text-xs font-medium whitespace-nowrap"
                  [style.color]="step() === s.n ? 'var(--primary)' : step() > s.n ? 'var(--text-primary)' : 'var(--text-secondary)'">
                  {{ s.label }}
                </span>
              </button>
              @if (!last) {
                <div class="flex-1 h-0.5 mx-3 mb-5 rounded-full transition-all duration-500"
                  [style.background]="step() > s.n ? 'var(--primary)' : 'var(--border)'"></div>
              }
            }
          </div>

          <!-- Progress bar (mobile) -->
          <div class="sm:hidden h-1.5 mx-6 mb-4 rounded-full overflow-hidden" style="background:var(--border)">
            <div class="h-full rounded-full transition-all duration-500" style="background:var(--primary)"
              [style.width]="progressPct() + '%'"></div>
          </div>
        </div>

        <!-- ══ BODY ════════════════════════════════════════════ -->
        <div class="flex-1 overflow-y-auto px-6 sm:px-8 py-7">

          <!-- ─── STEP 1 : Identification ─────────────────────── -->
          @if (step() === 1) {
            <div class="space-y-5">
              <div>
                <h2 class="font-bold text-lg mb-1" style="color:var(--text-primary)">🪪 Identification du produit</h2>
                <p class="text-sm" style="color:var(--text-secondary)">Informations de base pour identifier le produit</p>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="form-field">
                  <label class="form-label">Nom du produit (FR) *</label>
                  <input type="text" [(ngModel)]="form.name_fr" name="name_fr" required
                    placeholder="Ex: Doliprane 1000mg" class="form-input" />
                </div>
                <div class="form-field">
                  <label class="form-label">Catégorie *</label>
                  <select [ngModel]="form.category_id" (ngModelChange)="onCategoryChange($event)"
                    name="category_id" required class="form-input">
                    <option value="">-- Sélectionner une catégorie --</option>
                    @for (c of categories(); track c.id) {
                      <option [value]="c.id">{{ c.icon || '' }} {{ c.name_fr }}</option>
                    }
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label">Marque</label>
                  <select [(ngModel)]="form.marque_id" name="marque_id" class="form-input">
                    <option value="">-- Aucune marque --</option>
                    @for (m of marques(); track m.id) {
                      <option [value]="m.id">{{ m.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Barcode with scan button -->
              <div class="form-field">
                <label class="form-label">Code à barre</label>
                <div class="flex gap-2" style="max-width:380px">
                  <div class="relative flex-1">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-base">🔲</span>
                    <input type="text" [(ngModel)]="form.barcode" name="barcode"
                      placeholder="Ex: 6191234567890"
                      class="form-input pl-9 font-mono tracking-widest w-full" />
                  </div>
                  <button type="button" (click)="openScanner()"
                    class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all"
                    style="background:var(--bg-secondary);border:1.5px solid var(--border);color:var(--text-primary)"
                    title="Scanner avec la caméra">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M3 9V6a1 1 0 011-1h3M3 15v3a1 1 0 001 1h3m11-4v3a1 1 0 01-1 1h-3m4-11V6a1 1 0 00-1-1h-3M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01"/>
                    </svg>
                    Scanner
                  </button>
                </div>
                <p class="text-xs mt-1.5" style="color:var(--text-secondary)">
                  Saisissez manuellement ou utilisez la caméra pour scanner
                </p>
              </div>

              @if (form.category_id) {
                <div>
                  <label class="form-label mb-3 block">🗂️ Sous-catégories</label>
                  @if (subcategories().length) {
                    <div class="flex flex-wrap gap-2">
                      @for (sub of subcategories(); track sub.id) {
                        <label class="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all text-sm select-none"
                          [style.background]="isSubSelected(sub.id!) ? 'var(--primary-light)' : 'var(--bg-secondary)'"
                          [style.border]="isSubSelected(sub.id!) ? '1.5px solid var(--primary)' : '1.5px solid var(--border)'"
                          [style.color]="isSubSelected(sub.id!) ? 'var(--primary)' : 'var(--text-secondary)'">
                          <input type="checkbox" [checked]="isSubSelected(sub.id!)" (change)="toggleSub(sub.id!)" class="accent-[#008000]" />
                          <span>{{ sub.icon || '📂' }}</span>
                          <span class="font-medium">{{ sub.name_fr }}</span>
                        </label>
                      }
                    </div>
                  } @else {
                    <p class="text-sm" style="color:var(--text-secondary)">
                      Aucune sous-catégorie pour cette catégorie.
                      <a [routerLink]="['/admin/categories', form.category_id, 'edit']"
                        class="underline ml-1" style="color:var(--primary)">En ajouter →</a>
                    </p>
                  }
                </div>
              }

              @if (step1Error()) {
                <div class="p-3 rounded-xl text-sm" style="background:#fee2e2;color:#dc2626">
                  ⚠ {{ step1Error() }}
                </div>
              }
            </div>
          }

          <!-- ─── STEP 2 : Description ─────────────────────────── -->
          @if (step() === 2) {
            <div class="space-y-5">
              <div>
                <h2 class="font-bold text-lg mb-1" style="color:var(--text-primary)">📝 Description du produit</h2>
                <p class="text-sm" style="color:var(--text-secondary)">Décrivez le produit pour aider les clients à faire leur choix</p>
              </div>
              <div class="form-field">
                <label class="form-label">Description (FR)</label>
                <textarea [(ngModel)]="form.description_fr" name="description_fr" rows="8"
                  placeholder="Utilisation, composition, posologie, précautions d'emploi, contre-indications…"
                  class="form-input resize-none w-full"></textarea>
              </div>
              <div class="p-4 rounded-xl flex items-start gap-3 text-sm"
                style="background:var(--bg-secondary);border:1px solid var(--border)">
                <span class="text-base mt-0.5">💡</span>
                <span style="color:var(--text-secondary)">
                  Une bonne description améliore la visibilité du produit et aide les clients à trouver ce dont ils ont besoin.
                </span>
              </div>
            </div>
          }

          <!-- ─── STEP 3 : Prix & Stock ─────────────────────────── -->
          @if (step() === 3) {
            <div class="space-y-5">
              <div>
                <h2 class="font-bold text-lg mb-1" style="color:var(--text-primary)">💰 Prix & Stock</h2>
                <p class="text-sm" style="color:var(--text-secondary)">Le prix de vente est calculé automatiquement selon la marge configurée</p>
              </div>

              <div class="form-field">
                <label class="form-label">Prix (TND) *</label>
                <div class="relative" style="max-width:240px">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
                    style="color:var(--text-secondary)">TND</span>
                  <input type="number" [(ngModel)]="form.price" name="price"
                    required min="0" step="0.01" placeholder="0.00"
                    class="form-input pl-12" />
                </div>
              </div>

              <div class="p-4 rounded-xl text-center" style="background:var(--primary-light);border:1.5px solid var(--primary);max-width:240px">
                <p class="text-xs mb-1" style="color:var(--primary)">Prix de vente</p>
                <p class="text-xl font-extrabold" style="color:var(--primary)">
                  {{ (form.price ?? 0) | number:'1.2-2' }}
                  <span class="text-xs font-normal">TND</span>
                </p>
              </div>

              <div class="form-field">
                <label class="form-label">Quantité en stock *</label>
                <input type="number" [(ngModel)]="form.stock_quantity" name="stock_quantity"
                  required min="0" placeholder="0" class="form-input" style="max-width:200px" />
              </div>

              <div class="pt-2">
                <div class="h-px mb-5" style="background:var(--border)"></div>
                <h3 class="font-semibold mb-4" style="color:var(--text-primary)">📅 Dates du produit</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="form-field">
                    <label class="form-label">Date de fabrication</label>
                    <input type="date" [(ngModel)]="form.manufacture_date" name="manufacture_date" class="form-input" />
                  </div>
                  <div class="form-field">
                    <label class="form-label">Date d'expiration</label>
                    <input type="date" [(ngModel)]="form.expiration_date" name="expiration_date" class="form-input" />
                    <p class="text-xs mt-1.5 flex items-start gap-1" style="color:var(--text-secondary)">
                      <span style="color:#f59e0b">⚡</span>
                      Promotion automatique si expiration &lt; 60 jours
                    </p>
                  </div>
                </div>
              </div>

              @if (step3Error()) {
                <div class="p-3 rounded-xl text-sm" style="background:#fee2e2;color:#dc2626">
                  ⚠ {{ step3Error() }}
                </div>
              }
            </div>
          }

          <!-- ─── STEP 4 : Images ──────────────────────────────── -->
          @if (step() === 4) {
            <div class="space-y-5">
              <div>
                <h2 class="font-bold text-lg mb-1" style="color:var(--text-primary)">🖼️ Images du produit</h2>
                <p class="text-sm" style="color:var(--text-secondary)">
                  Ajoutez jusqu'à 10 images. La première sera l'image principale.
                </p>
              </div>

              <div class="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all"
                [style.border-color]="dragOver() ? 'var(--primary)' : 'var(--border)'"
                [style.background]="dragOver() ? 'var(--primary-light)' : 'var(--bg)'"
                (click)="fileInput.click()"
                (dragover)="$event.preventDefault(); dragOver.set(true)"
                (dragleave)="dragOver.set(false)"
                (drop)="onDrop($event)">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style="background:var(--primary-light)">
                  <svg class="w-7 h-7" style="color:var(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p class="font-semibold text-base mb-1" style="color:var(--text-primary)">Cliquer ou glisser vos images ici</p>
                <p class="text-sm" style="color:var(--text-secondary)">PNG · JPG · WEBP — 5 Mo max par image</p>
              </div>
              <input #fileInput type="file" accept="image/*" multiple class="hidden" (change)="onFilePicked($event)" />

              @if (imageUrls().length) {
                <div>
                  <p class="text-sm font-medium mb-3" style="color:var(--text-secondary)">
                    {{ imageUrls().length }} image(s) ajoutée(s)
                  </p>
                  <div class="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    @for (img of imageUrls(); track img.url; let i = $index) {
                      <div class="relative group aspect-square rounded-xl overflow-hidden border"
                        style="border-color:var(--border)">
                        @if (img.uploading) {
                          <div class="absolute inset-0 flex flex-col items-center justify-center gap-2"
                            style="background:var(--bg-secondary)">
                            <svg class="w-5 h-5 animate-spin" style="color:var(--primary)" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            <span class="text-xs" style="color:var(--text-secondary)">{{ img.progress }}%</span>
                          </div>
                        } @else {
                          <img [src]="img.url" class="w-full h-full object-cover" />
                          <button type="button" (click)="removeImage(i)"
                            class="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            style="background:#dc2626;color:white">✕</button>
                          @if (i === 0) {
                            <span class="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 rounded font-semibold"
                              style="background:var(--primary);color:white">⭐</span>
                          }
                        }
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="flex items-center gap-3 p-4 rounded-xl text-sm"
                  style="background:var(--bg-secondary);border:1px solid var(--border)">
                  <span style="color:#f59e0b">💡</span>
                  <span style="color:var(--text-secondary)">Les images ne sont pas obligatoires, vous pouvez en ajouter plus tard.</span>
                </div>
              }
            </div>
          }

          <!-- ─── STEP 5 : Options + Récapitulatif ─────────────── -->
          @if (step() === 5) {
            <div class="space-y-6">
              <div>
                <h2 class="font-bold text-lg mb-1" style="color:var(--text-primary)">⚙️ Options & Récapitulatif</h2>
                <p class="text-sm" style="color:var(--text-secondary)">Finalisez la configuration avant de sauvegarder</p>
              </div>

              <div>
                <p class="form-label mb-3">📡 Statut de publication</p>
                <div class="grid grid-cols-2 gap-3">
                  <label class="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all select-none"
                    [style.background]="form.status === 'active' ? '#f0fdf4' : 'var(--bg-secondary)'"
                    [style.border]="form.status === 'active' ? '2px solid #86efac' : '2px solid var(--border)'">
                    <input type="radio" [(ngModel)]="form.status" name="status" value="active" class="accent-green-500" />
                    <div>
                      <p class="font-bold text-sm" style="color:#16a34a">✅ Actif</p>
                      <p class="text-xs mt-0.5" style="color:#6b7280">Visible sur la boutique</p>
                    </div>
                  </label>
                  <label class="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all select-none"
                    [style.background]="form.status === 'inactive' ? '#fef3c7' : 'var(--bg-secondary)'"
                    [style.border]="form.status === 'inactive' ? '2px solid #fcd34d' : '2px solid var(--border)'">
                    <input type="radio" [(ngModel)]="form.status" name="status" value="inactive" class="accent-amber-500" />
                    <div>
                      <p class="font-bold text-sm" style="color:#d97706">⏸️ Inactif</p>
                      <p class="text-xs mt-0.5" style="color:#6b7280">Masqué de la boutique</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <p class="form-label mb-2">🏷️ Mots-clés (SEO & recherche)</p>
                <div class="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                  @for (kw of form.keywords ?? []; track kw; let i = $index) {
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style="background:var(--primary-light);color:var(--primary)">
                      {{ kw }}
                      <button type="button" (click)="removeKeyword(i)"
                        class="w-3.5 h-3.5 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-100"
                        style="color:#dc2626">✕</button>
                    </span>
                  }
                </div>
                <input type="text" [ngModel]="kwInput" (ngModelChange)="kwInput = $event"
                  name="kwInput" placeholder="Mot-clé puis Entrée ou virgule…"
                  class="form-input text-sm" (keydown)="onKwKey($event)" />
                <p class="text-xs mt-1" style="color:var(--text-secondary)">Appuyez sur Entrée ou virgule pour ajouter</p>
              </div>

              <!-- Récapitulatif -->
              <div class="rounded-2xl overflow-hidden" style="border:1.5px solid var(--border)">
                <div class="px-5 py-3" style="background:var(--bg-secondary);border-bottom:1px solid var(--border)">
                  <p class="font-bold text-sm" style="color:var(--text-primary)">📋 Récapitulatif avant sauvegarde</p>
                </div>
                <div class="divide-y" style="border-color:var(--border)">
                  <div class="flex justify-between px-5 py-3 text-sm">
                    <span style="color:var(--text-secondary)">Nom</span>
                    <span class="font-medium" style="color:var(--text-primary)">{{ form.name_fr || '—' }}</span>
                  </div>
                  @if (form.barcode) {
                    <div class="flex justify-between px-5 py-3 text-sm">
                      <span style="color:var(--text-secondary)">Code à barre</span>
                      <span class="font-mono font-medium" style="color:var(--text-primary)">{{ form.barcode }}</span>
                    </div>
                  }
                  <div class="flex justify-between px-5 py-3 text-sm">
                    <span style="color:var(--text-secondary)">Catégorie</span>
                    <span class="font-medium" style="color:var(--text-primary)">
                      {{ getCategoryName(form.category_id ?? '') || '—' }}
                    </span>
                  </div>
                  <div class="flex justify-between px-5 py-3 text-sm">
                    <span style="color:var(--text-secondary)">Prix</span>
                    <span class="font-bold" style="color:var(--primary)">
                      {{ (form.price ?? 0) | number:'1.2-2' }} TND
                    </span>
                  </div>
                  <div class="flex justify-between px-5 py-3 text-sm">
                    <span style="color:var(--text-secondary)">Stock</span>
                    <span class="font-medium" style="color:var(--text-primary)">{{ form.stock_quantity ?? 0 }} unités</span>
                  </div>
                  <div class="flex justify-between px-5 py-3 text-sm">
                    <span style="color:var(--text-secondary)">Images</span>
                    <span class="font-medium" style="color:var(--text-primary)">{{ imageUrls().length }} image(s)</span>
                  </div>
                </div>
              </div>

              @if (error()) {
                <div class="p-4 rounded-xl text-sm" style="background:#fee2e2;color:#dc2626">⚠ {{ error() }}</div>
              }
            </div>
          }

        </div>

        <!-- ══ FOOTER ══════════════════════════════════════════ -->
        <div class="shrink-0 flex items-center justify-between px-6 sm:px-8 py-4 gap-4"
          style="border-top:2px solid var(--border);background:var(--bg-secondary)">
          <div class="flex-1 min-w-0">
            @if (step() === 1) {
              <a routerLink="/admin/products"
                class="text-sm font-medium hover:underline" style="color:var(--text-secondary)">
                ← Retour à la liste
              </a>
            } @else {
              <p class="text-xs" style="color:var(--text-secondary)">Étape {{ step() }}/{{ STEPS.length }}</p>
            }
          </div>
          <div class="flex items-center gap-3 shrink-0">
            @if (step() > 1) {
              <button type="button" (click)="prevStep()" class="btn-secondary py-2.5 px-5 text-sm">
                ← Précédent
              </button>
            }
            @if (step() < STEPS.length) {
              <button type="button" (click)="tryNextStep()" class="btn-primary py-2.5 px-7">
                Suivant →
              </button>
            } @else {
              <button type="submit" [disabled]="saving() || uploading()"
                class="btn-primary py-2.5 px-7 flex items-center gap-2"
                [class.opacity-60]="saving() || uploading()">
                @if (saving()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Enregistrement…
                } @else if (uploading()) {
                  ⏳ Upload en cours…
                } @else {
                  💾 Sauvegarder
                }
              </button>
            }
          </div>
        </div>

      </form>
    </div>
  `,
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private productSvc     = inject(ProductService);
  private categorySvc    = inject(CategoryService);
  private subcategorySvc = inject(SubcategoryService);
  private marqueSvc      = inject(MarqueService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  protected categories    = toSignal(this.categorySvc.getAll(), { initialValue: [] });
  protected marques       = toSignal(this.marqueSvc.getAll(), { initialValue: [] as Marque[] });
  protected subcategories = signal<Subcategory[]>([]);
  protected isEdit  = signal(false);
  protected saving  = signal(false);
  protected error   = signal('');
  protected dragOver = signal(false);
  protected step    = signal(1);

  readonly STEPS = STEPS;

  protected imageUrls   = signal<{ url: string; uploading: boolean; progress: number }[]>([]);
  protected uploading   = computed(() => this.imageUrls().some(i => i.uploading));
  protected progressPct = computed(() => Math.round((this.step() / STEPS.length) * 100));

  protected step1Error  = signal('');
  protected step3Error  = signal('');

  // ── Scanner state ────────────────────────────────────────────
  protected scanning     = signal(false);
  protected scannerError = signal('');
  protected scannedValue = signal('');
  private codeReader: BrowserMultiFormatReader | null = null;
  private scanControls: IScannerControls | null = null;

  protected kwInput = '';

  protected form: Partial<Product> = {
    name_fr: '', description_fr: '', category_id: '',
    price: 0, stock_quantity: 0, marque_id: '',
    manufacture_date: '', expiration_date: '',
    images: [], barcode: '', keywords: [], subcategory_ids: [], status: 'active',
  };

  private editId: string | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.editId = id;
      const p = await this.productSvc.getById(id);
      if (p) {
        this.form = { ...p };
        this.imageUrls.set((p.images ?? []).map(url => ({ url, uploading: false, progress: 100 })));
        if (p.category_id) this.loadSubcategories(p.category_id);
      }
    }
  }

  ngOnDestroy(): void {
    this.stopScanControls();
  }

  // ── Scanner methods ──────────────────────────────────────────

  openScanner(): void {
    this.scannerError.set('');
    this.scannedValue.set('');
    this.scanning.set(true);
    // Wait one tick for the video element to be rendered in the DOM
    setTimeout(() => this.startDecoding(), 80);
  }

  private async startDecoding(): Promise<void> {
    const videoEl = document.getElementById('barcode-scanner-video') as HTMLVideoElement | null;
    if (!videoEl) { this.scannerError.set('Élément vidéo introuvable.'); return; }

    try {
      this.codeReader = new BrowserMultiFormatReader();
      this.scanControls = await this.codeReader.decodeFromVideoDevice(
        undefined, // default camera (back camera preferred on mobile)
        videoEl,
        (result, _err) => {
          if (result) {
            const code = result.getText();
            this.scannedValue.set(code);
            this.form.barcode = code;
            // Short delay so user sees the scanned value before closing
            setTimeout(() => this.closeScanner(), 600);
          }
        }
      );
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        this.scannerError.set('Permission caméra refusée. Autorisez l\'accès dans les paramètres du navigateur.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        this.scannerError.set('Aucune caméra détectée sur cet appareil.');
      } else {
        this.scannerError.set('Impossible d\'accéder à la caméra.');
      }
    }
  }

  closeScanner(): void {
    this.stopScanControls();
    this.scanning.set(false);
    this.scannedValue.set('');
    this.scannerError.set('');
  }

  private stopScanControls(): void {
    if (this.scanControls) {
      this.scanControls.stop();
      this.scanControls = null;
    }
    this.codeReader = null;
  }

  // ── Steps ────────────────────────────────────────────────────

  goTo(n: number): void { this.step.set(n); }

  tryNextStep(): void {
    this.step1Error.set('');
    this.step3Error.set('');
    if (this.step() === 1) {
      if (!this.form.name_fr?.trim()) { this.step1Error.set('Le nom du produit est obligatoire.'); return; }
      if (!this.form.category_id)      { this.step1Error.set('Veuillez sélectionner une catégorie.'); return; }
    }
    if (this.step() === 3 && (this.form.price ?? 0) <= 0) {
      this.step3Error.set('Veuillez saisir un prix valide.'); return;
    }
    this.step.update(s => s + 1);
  }

  prevStep(): void {
    this.step1Error.set('');
    this.step3Error.set('');
    this.step.update(s => s - 1);
  }

  // ── Form helpers ─────────────────────────────────────────────

  onCategoryChange(catId: string): void {
    this.form.category_id = catId;
    this.form.subcategory_ids = [];
    this.loadSubcategories(catId);
  }

  private loadSubcategories(categoryId: number | string): void {
    this.subcategorySvc.getByCategory(categoryId).subscribe(list => this.subcategories.set(list));
  }

  isSubSelected(id: number | string): boolean { return (this.form.subcategory_ids ?? []).map(String).includes(String(id)); }

  toggleSub(id: number | string): void {
    const current = this.form.subcategory_ids ?? [];
    const sid = String(id);
    this.form.subcategory_ids = current.map(String).includes(sid) ? current.filter(s => String(s) !== sid) : [...current, sid];
  }


  getCategoryName(id: number | string): string {
    const cat = (this.categories() as any[]).find((c: any) => String(c.id) === String(id));
    return cat?.name_fr ?? '';
  }

  onKwKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const val = this.kwInput.trim().replace(/,$/, '');
      if (val && !(this.form.keywords ?? []).includes(val)) {
        this.form.keywords = [...(this.form.keywords ?? []), val];
      }
      this.kwInput = '';
    }
  }

  removeKeyword(i: number): void {
    this.form.keywords = (this.form.keywords ?? []).filter((_, idx) => idx !== i);
  }

  onFilePicked(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    (event.target as HTMLInputElement).value = '';
    this.uploadFiles(files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
    this.uploadFiles(files);
  }

  private async uploadFiles(files: File[]): Promise<void> {
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { this.error.set(`"${file.name}" dépasse 5 Mo.`); continue; }
      const idx = this.imageUrls().length;
      this.imageUrls.update(list => [...list, { url: '', uploading: true, progress: 0 }]);
      const timer = setInterval(() => {
        this.imageUrls.update(list => list.map((item, i) =>
          i === idx ? { ...item, progress: Math.min(item.progress + 15, 85) } : item
        ));
      }, 200);
      try {
        const url = await this.productSvc.uploadImage(file);
        clearInterval(timer);
        this.imageUrls.update(list => list.map((item, i) =>
          i === idx ? { url, uploading: false, progress: 100 } : item
        ));
      } catch (e: any) {
        clearInterval(timer);
        this.imageUrls.update(list => list.filter((_, i) => i !== idx));
        this.error.set(`Erreur upload "${file.name}": ${e.message}`);
      }
    }
  }

  removeImage(i: number): void {
    this.imageUrls.update(list => list.filter((_, idx) => idx !== i));
  }

  async save(): Promise<void> {
    if (this.uploading()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const payload = this.buildPayload();
      if (this.isEdit() && this.editId) {
        await this.productSvc.update(this.editId, payload);
      } else {
        await this.productSvc.add(payload);
      }
      this.router.navigate(['/admin/products']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erreur lors de l\'enregistrement');
    } finally {
      this.saving.set(false);
    }
  }

  private buildPayload(): Product {
    return {
      name_fr:             this.form.name_fr             ?? '',
      name_ar:             this.form.name_ar             ?? '',
      name_en:             this.form.name_en             ?? '',
      description_fr:      this.form.description_fr      ?? '',
      description_ar:      this.form.description_ar      ?? '',
      description_en:      this.form.description_en      ?? '',
      category_id:         this.form.category_id         ?? '',
      price:               this.form.price               ?? 0,
      stock_quantity:      this.form.stock_quantity       ?? 0,
      manufacture_date:    this.form.manufacture_date,
      expiration_date:     this.form.expiration_date,
      images:              this.imageUrls().filter(i => i.url).map(i => i.url),
      barcode:             this.form.barcode,
      keywords:            this.form.keywords            ?? [],
      subcategory_ids:     this.form.subcategory_ids     ?? [],
      marque_id:           this.form.marque_id           ?? '',
      status:              this.form.status              ?? 'active',
      has_promotion:       this.form.has_promotion       ?? false,
      promotion_discount:  this.form.promotion_discount  ?? 0,
    };
  }
}
