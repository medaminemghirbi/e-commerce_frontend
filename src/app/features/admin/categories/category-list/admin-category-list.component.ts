import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../../core/services/category.service';
import { SubcategoryService } from '../../../../core/services/subcategory.service';
import { Category } from '../../../../core/models/category.model';
import { Subcategory } from '../../../../core/models/subcategory.model';
import { EmojiPickerComponent } from '../../../../shared/components/emoji-picker/emoji-picker.component';

@Component({
  selector: 'app-admin-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EmojiPickerComponent],
  styles: [`
    .cat-row { transition: background 0.15s; cursor: pointer; }
    .cat-row:hover { background: var(--bg-secondary); }
    .cat-row.active { background: var(--primary-light) !important; border-left: 3px solid var(--primary); }
  `],
  template: `
    <div class="flex flex-col h-full" style="min-height:0">

      <!-- Page header -->
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-2xl font-extrabold" style="color:var(--text-primary)">Catégories</h1>
          <p class="text-sm mt-0.5" style="color:var(--text-secondary)">
            {{ categories().length }} catégorie(s) · {{ allSubcats().length }} sous-catégorie(s)
          </p>
        </div>
        <button (click)="startNew()" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nouvelle catégorie
        </button>
      </div>

      <!-- Split layout -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5 flex-1 min-h-0">

        <!-- ══ LEFT: Category list ════════════════════════════ -->
        <div class="lg:col-span-2 flex flex-col gap-2">
          <div class="card overflow-hidden flex flex-col">

            <!-- List header -->
            <div class="px-4 py-3 border-b" style="border-color:var(--border);background:var(--bg-secondary)">
              <p class="text-xs font-bold uppercase tracking-widest" style="color:var(--text-secondary)">
                Catégories ({{ categories().length }})
              </p>
            </div>

            <!-- Category rows -->
            <div class="divide-y overflow-y-auto" style="border-color:var(--border);max-height:70vh">
              @for (cat of categories(); track cat.id) {
                <div class="cat-row px-4 py-3 flex items-center gap-3"
                  [class.active]="selectedId() === cat.id"
                  (click)="selectCat(cat)">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    [style.background]="selectedId() === cat.id ? 'var(--primary)' : 'var(--bg-secondary)'">
                    {{ cat.icon || '🏥' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-sm truncate" style="color:var(--text-primary)">{{ cat.name_fr }}</p>
                    <p class="text-xs" style="color:var(--text-secondary)">
                      {{ getSubcats(cat.id!).length }} sous-catégorie(s)
                    </p>
                  </div>
                  <!-- Subcat chips preview -->
                  <div class="flex items-center gap-1 shrink-0">
                    @for (sub of getSubcats(cat.id!).slice(0, 2); track sub.id) {
                      <span class="text-xs px-1.5 py-0.5 rounded-md"
                        style="background:var(--bg-secondary);color:var(--text-secondary);border:1px solid var(--border)">
                        {{ sub.icon || '📂' }}
                      </span>
                    }
                    @if (getSubcats(cat.id!).length > 2) {
                      <span class="text-xs" style="color:var(--text-secondary)">+{{ getSubcats(cat.id!).length - 2 }}</span>
                    }
                  </div>
                  <svg class="w-4 h-4 shrink-0" style="color:var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              }

              @if (!categories().length) {
                <div class="py-12 text-center text-sm" style="color:var(--text-secondary)">
                  Aucune catégorie. Créez-en une !
                </div>
              }
            </div>
          </div>
        </div>

        <!-- ══ RIGHT: Editor panel ════════════════════════════ -->
        <div class="lg:col-span-3">

          <!-- Idle state -->
          @if (mode() === 'idle') {
            <div class="card h-full flex flex-col items-center justify-center py-20 text-center">
              <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                style="background:var(--primary-light)">🏥</div>
              <p class="font-bold text-base mb-1" style="color:var(--text-primary)">
                Sélectionnez une catégorie
              </p>
              <p class="text-sm mb-5" style="color:var(--text-secondary)">
                Cliquez sur une catégorie pour la modifier,<br/>ou créez-en une nouvelle.
              </p>
              <button (click)="startNew()" class="btn-primary">
                + Nouvelle catégorie
              </button>
            </div>
          }

          <!-- Add / Edit form -->
          @if (mode() === 'new' || mode() === 'edit') {
            <div class="space-y-5">

              <!-- ① Catégorie card -->
              <div class="card overflow-hidden">
                <div class="px-6 py-4 flex items-center justify-between border-b"
                  style="border-color:var(--border);background:var(--bg-secondary)">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style="background:var(--primary)">1</span>
                    <h2 class="font-bold text-sm uppercase tracking-widest" style="color:var(--text-primary)">
                      {{ mode() === 'new' ? 'Nouvelle catégorie' : 'Modifier la catégorie' }}
                    </h2>
                  </div>
                  @if (mode() === 'edit') {
                    <button (click)="cancelEdit()" class="text-xs font-medium hover:underline"
                      style="color:var(--text-secondary)">Annuler</button>
                  }
                </div>

                <div class="p-6 space-y-5">
                  <!-- Name + icon preview -->
                  <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                      style="background:var(--primary-light)">
                      {{ catForm.icon || '🏥' }}
                    </div>
                    <div class="flex-1 form-field">
                      <label class="form-label">Nom de la catégorie *</label>
                      <input type="text" [(ngModel)]="catForm.name_fr" name="cat_name_fr" required
                        placeholder="Ex: Médicaments, Matériel médical…"
                        class="form-input" />
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="form-field">
                    <label class="form-label">Description (optionnel)</label>
                    <textarea [(ngModel)]="catForm.description" name="cat_desc" rows="2"
                      placeholder="Courte description de la catégorie…"
                      class="form-input resize-none"></textarea>
                  </div>

                  <!-- Icon picker -->
                  <div class="form-field">
                    <label class="form-label mb-2 block">Icône</label>
                    <app-emoji-picker [value]="catForm.icon || ''" (picked)="catForm.icon = $event" />
                  </div>

                  @if (catError()) {
                    <div class="p-3 rounded-xl text-sm" style="background:#fee2e2;color:#dc2626">⚠ {{ catError() }}</div>
                  }

                  <!-- Actions -->
                  <div class="flex items-center gap-3 pt-1">
                    <button (click)="saveCat()" [disabled]="savingCat()"
                      class="btn-primary py-2.5 px-6 flex items-center gap-2"
                      [class.opacity-60]="savingCat()">
                      @if (savingCat()) {
                        <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                      }
                      {{ mode() === 'new' ? '✅ Créer la catégorie' : '💾 Sauvegarder' }}
                    </button>

                    @if (mode() === 'edit') {
                      @if (!confirmDeleteCat()) {
                        <button (click)="confirmDeleteCat.set(true)"
                          class="ml-auto flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                          style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5">
                          🗑️ Supprimer
                        </button>
                      } @else {
                        <div class="ml-auto flex items-center gap-2">
                          <span class="text-xs" style="color:#dc2626">Confirmer ?</span>
                          <button (click)="confirmDeleteCat.set(false)"
                            class="px-3 py-1.5 rounded-lg text-xs"
                            style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary)">
                            Non
                          </button>
                          <button (click)="deleteCat()"
                            class="px-3 py-1.5 rounded-lg text-xs font-bold"
                            style="background:#dc2626;color:white">
                            Oui, supprimer
                          </button>
                        </div>
                      }
                    }
                  </div>
                </div>
              </div>

              <!-- ② Sous-catégories card (edit only) -->
              @if (mode() === 'edit') {
                <div class="card overflow-hidden">
                  <div class="px-6 py-4 border-b flex items-center gap-2"
                    style="border-color:var(--border);background:var(--bg-secondary)">
                    <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style="background:var(--primary)">2</span>
                    <h2 class="font-bold text-sm uppercase tracking-widest" style="color:var(--text-primary)">
                      Sous-catégories
                    </h2>
                    <span class="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                      style="background:var(--primary-light);color:var(--primary)">
                      {{ subcategories().length }}
                    </span>
                  </div>

                  <div class="p-6 space-y-4">

                    <!-- Existing subcategories -->
                    @if (subcategories().length) {
                      <div class="space-y-2">
                        @for (sub of subcategories(); track sub.id) {
                          <div class="flex items-center gap-3 px-4 py-3 rounded-xl group"
                            style="background:var(--bg-secondary);border:1px solid var(--border)">
                            @if (editingSubId() === sub.id) {
                              <!-- Inline edit mode -->
                              <div class="flex-1 space-y-2">
                                <div class="flex items-center gap-2">
                                  <span class="text-xl">{{ editSubForm.icon || sub.icon || '📂' }}</span>
                                  <input type="text" [(ngModel)]="editSubForm.name_fr"
                                    class="form-input flex-1 py-1 text-sm" />
                                  <button (click)="saveSubEdit(sub)"
                                    class="px-2 py-1 rounded-lg text-xs font-bold shrink-0"
                                    style="background:var(--primary);color:white">✓</button>
                                  <button (click)="editingSubId.set(null)"
                                    class="px-2 py-1 rounded-lg text-xs shrink-0"
                                    style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-secondary)">✕</button>
                                </div>
                                <app-emoji-picker [value]="editSubForm.icon || ''" (picked)="editSubForm.icon = $event" />
                              </div>
                            } @else {
                              <span class="text-xl">{{ sub.icon || '📂' }}</span>
                              <span class="flex-1 font-medium text-sm" style="color:var(--text-primary)">{{ sub.name_fr }}</span>
                              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button (click)="startEditSub(sub)"
                                  class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-green-50"
                                  style="color:var(--primary)">
                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                  </svg>
                                </button>
                                <button (click)="deleteSub(sub)"
                                  class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                                  style="color:#dc2626">
                                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                  </svg>
                                </button>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-sm text-center py-3" style="color:var(--text-secondary)">
                        Aucune sous-catégorie pour l'instant.
                      </p>
                    }

                    <!-- Add subcategory form -->
                    @if (!showAddSub()) {
                      <button (click)="showAddSub.set(true)"
                        class="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:border-green-500"
                        style="border-color:var(--border);color:var(--text-secondary)">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Ajouter une sous-catégorie
                      </button>
                    } @else {
                      <div class="p-4 rounded-xl space-y-4"
                        style="background:var(--bg-secondary);border:1.5px solid var(--primary)">
                        <p class="font-semibold text-sm" style="color:var(--text-primary)">Nouvelle sous-catégorie</p>

                        <!-- Name + icon preview -->
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                            style="background:var(--bg-card)">
                            {{ newSub.icon || '📂' }}
                          </div>
                          <input type="text" [(ngModel)]="newSub.name_fr"
                            placeholder="Nom de la sous-catégorie *"
                            class="form-input flex-1" />
                        </div>

                        <!-- Icon picker (compact) -->
                        <app-emoji-picker [value]="newSub.icon || ''" (picked)="newSub.icon = $event" />

                        @if (subError()) {
                          <p class="text-xs" style="color:#dc2626">⚠ {{ subError() }}</p>
                        }

                        <div class="flex gap-2">
                          <button (click)="addSub()" [disabled]="addingSub()"
                            class="btn-primary py-2 px-5 text-sm flex items-center gap-2"
                            [class.opacity-60]="addingSub()">
                            @if (addingSub()) {
                              <svg class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                            }
                            Ajouter
                          </button>
                          <button (click)="cancelAddSub()"
                            class="btn-secondary py-2 px-4 text-sm">
                            Annuler
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (mode() === 'new') {
                <p class="text-sm text-center" style="color:var(--text-secondary)">
                  💡 Après la création, vous pourrez ajouter des sous-catégories.
                </p>
              }

            </div>
          }

        </div>
      </div>
    </div>
  `,
})
export class AdminCategoryListComponent {
  private categorySvc    = inject(CategoryService);
  private subcategorySvc = inject(SubcategoryService);

  protected categories = signal<Category[]>([]);
  protected allSubcats = signal<Subcategory[]>([]);

  protected subcategories  = signal<Subcategory[]>([]);
  protected mode           = signal<'idle' | 'new' | 'edit'>('idle');
  protected selectedId     = signal<number | string | null>(null);

  // Category form
  protected catForm        = this.blankCat();
  protected savingCat      = signal(false);
  protected catError       = signal('');
  protected confirmDeleteCat = signal(false);

  // Subcategory management
  protected showAddSub     = signal(false);
  protected addingSub      = signal(false);
  protected subError       = signal('');
  protected newSub         = this.blankSub();
  protected editingSubId   = signal<number | string | null>(null);
  protected editSubForm    = { name_fr: '', icon: '📂' };

  constructor() {
    this.refresh();
    effect(() => {
      const id = this.selectedId();
      if (id) {
        this.subcategorySvc.getByCategory(id).subscribe(list => this.subcategories.set(list));
      }
    });
  }

  private refresh(): void {
    this.categorySvc.getAll().subscribe(list => this.categories.set(list));
    this.refreshSubs();
  }

  private refreshSubs(): void {
    this.subcategorySvc.getAll().subscribe(list => this.allSubcats.set(list));
    const id = this.selectedId();
    if (id) this.subcategorySvc.getByCategory(id).subscribe(list => this.subcategories.set(list));
  }

  getSubcats(categoryId: number | string): Subcategory[] {
    return this.allSubcats().filter(s => String(s.category_id) === String(categoryId));
  }

  // ── Selection / navigation ───────────────────────────────────

  selectCat(cat: Category): void {
    this.selectedId.set(cat.id!);
    this.catForm = { name_fr: cat.name_fr, description: (cat as any).description ?? '', icon: cat.icon ?? '🏥' };
    this.mode.set('edit');
    this.catError.set('');
    this.confirmDeleteCat.set(false);
    this.showAddSub.set(false);
    this.editingSubId.set(null);
    this.newSub = this.blankSub();
  }

  startNew(): void {
    this.selectedId.set(null);
    this.catForm = this.blankCat();
    this.catError.set('');
    this.confirmDeleteCat.set(false);
    this.mode.set('new');
  }

  cancelEdit(): void {
    this.mode.set('idle');
    this.selectedId.set(null);
  }

  // ── Category CRUD ────────────────────────────────────────────

  async saveCat(): Promise<void> {
    if (!this.catForm.name_fr?.trim()) { this.catError.set('Le nom est obligatoire.'); return; }
    this.savingCat.set(true);
    this.catError.set('');
    try {
      if (this.mode() === 'edit' && this.selectedId()) {
        await this.categorySvc.update(this.selectedId()!, this.catForm);
      } else {
        const newId = await this.categorySvc.add(this.catForm as Category);
        this.selectedId.set(newId);
        this.mode.set('edit');
      }
      this.refresh();
    } catch (e: any) {
      this.catError.set(e.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      this.savingCat.set(false);
    }
  }

  async deleteCat(): Promise<void> {
    const id = this.selectedId();
    if (!id) return;
    try {
      await this.categorySvc.delete(id);
      this.refresh();
      this.mode.set('idle');
      this.selectedId.set(null);
      this.confirmDeleteCat.set(false);
    } catch (e: any) {
      this.catError.set(e.message ?? 'Erreur lors de la suppression.');
      this.confirmDeleteCat.set(false);
    }
  }

  // ── Subcategory CRUD ─────────────────────────────────────────

  async addSub(): Promise<void> {
    if (!this.newSub.name_fr?.trim()) { this.subError.set('Le nom est requis.'); return; }
    this.addingSub.set(true);
    this.subError.set('');
    try {
      await this.subcategorySvc.add({
        category_id: this.selectedId()!,
        name_fr: this.newSub.name_fr!.trim(),
        name_ar: '', name_en: '',
        icon: this.newSub.icon ?? '📂',
      });
      this.newSub = this.blankSub();
      this.showAddSub.set(false);
      this.refreshSubs();
    } catch (e: any) {
      this.subError.set(e.message ?? 'Erreur.');
    } finally {
      this.addingSub.set(false);
    }
  }

  cancelAddSub(): void {
    this.showAddSub.set(false);
    this.subError.set('');
    this.newSub = this.blankSub();
  }

  startEditSub(sub: Subcategory): void {
    this.editingSubId.set(sub.id!);
    this.editSubForm = { name_fr: sub.name_fr, icon: sub.icon ?? '📂' };
  }

  async saveSubEdit(sub: Subcategory): Promise<void> {
    if (!this.editSubForm.name_fr.trim()) return;
    try {
      await this.subcategorySvc.update(sub.id!, {
        ...sub,
        name_fr: this.editSubForm.name_fr.trim(),
        icon: this.editSubForm.icon,
      });
      this.editingSubId.set(null);
      this.refreshSubs();
    } catch (e: any) {
      this.subError.set(e.message ?? 'Erreur.');
    }
  }

  async deleteSub(sub: Subcategory): Promise<void> {
    try {
      await this.subcategorySvc.delete(sub.id!);
      this.refreshSubs();
    } catch (e: any) {
      this.subError.set(e.message ?? 'Erreur.');
    }
  }

  // ── Helpers ──────────────────────────────────────────────────

  private blankCat() { return { name_fr: '', description: '', icon: '🏥' }; }
  private blankSub() { return { name_fr: '', icon: '📂' }; }
}
