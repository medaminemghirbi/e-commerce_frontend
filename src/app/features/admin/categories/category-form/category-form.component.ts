import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CategoryService } from '../../../../core/services/category.service';
import { SubcategoryService } from '../../../../core/services/subcategory.service';
import { Category } from '../../../../core/models/category.model';
import { Subcategory } from '../../../../core/models/subcategory.model';
import { EmojiPickerComponent } from '../../../../shared/components/emoji-picker/emoji-picker.component';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe, EmojiPickerComponent],
  template: `
    <div class="max-w-2xl space-y-6">
      <div class="flex items-center gap-4 mb-2">
        <a routerLink="/admin/categories" class="w-9 h-9 flex items-center justify-center rounded-xl" style="border: 1px solid var(--border)">
          <svg class="w-4 h-4" style="color: var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </a>
        <h1 class="text-2xl font-extrabold" style="color: var(--text-primary)">
          {{ isEdit() ? ('ADMIN.CATEGORIES.EDIT' | translate) : ('ADMIN.CATEGORIES.ADD' | translate) }}
        </h1>
      </div>

      <!-- Catégorie principale -->
      <form (ngSubmit)="save()" class="space-y-5">
        <div class="card p-6 space-y-4">
          <h2 class="font-bold" style="color:var(--text-primary)">📁 Catégorie</h2>
          <div class="form-field">
            <label class="form-label">{{ 'CATEGORY.NAME_FR' | translate }} *</label>
            <input type="text" [(ngModel)]="form.name_fr" name="name_fr" required class="form-input" />
          </div>
          <div class="form-field">
            <label class="form-label">{{ 'CATEGORY.DESCRIPTION' | translate }}</label>
            <textarea [(ngModel)]="form.description" name="description" rows="2" class="form-input resize-none"></textarea>
          </div>
          <div class="form-field">
            <label class="form-label">{{ 'CATEGORY.ICON' | translate }}</label>
            <app-emoji-picker [value]="form.icon || ''" (picked)="form.icon = $event" />
          </div>
        </div>

        @if (error()) {
          <div class="rounded-xl p-4 text-sm" style="background:#fee2e2;color:#dc2626">{{ error() }}</div>
        }

        <div class="flex gap-3">
          <button type="submit" [disabled]="saving()" class="btn-primary py-3 px-8">{{ 'ADMIN.SAVE' | translate }}</button>
          <a routerLink="/admin/categories" class="btn-secondary py-3 px-8">{{ 'ADMIN.CANCEL' | translate }}</a>
        </div>
      </form>

      <!-- Sous-catégories (mode édition uniquement) -->
      @if (isEdit()) {
        <div class="card p-6 space-y-4">
          <h2 class="font-bold" style="color:var(--text-primary)">🗂️ Sous-catégories</h2>

          <!-- Liste existante -->
          <div class="space-y-2">
            @for (sub of subcategories(); track sub.id) {
              <div class="flex items-center gap-3 p-3 rounded-xl" style="background:var(--bg-secondary)">
                <span class="text-xl">{{ sub.icon || '📂' }}</span>
                <span class="flex-1 font-medium text-sm" style="color:var(--text-primary)">{{ sub.name_fr }}</span>
                <button (click)="deleteSub(sub)"
                  class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-100"
                  style="color:#dc2626">✕</button>
              </div>
            }
            @if (!subcategories().length) {
              <p class="text-sm text-center py-4" style="color:var(--text-secondary)">Aucune sous-catégorie</p>
            }
          </div>

          <!-- Formulaire ajout -->
          <div class="border-t pt-4 space-y-3" style="border-color:var(--border)">
            <p class="text-sm font-semibold" style="color:var(--text-primary)">Ajouter une sous-catégorie</p>
            <input type="text" [(ngModel)]="newSub.name_fr" placeholder="Nom (fr) *" class="form-input" />
            <div class="form-field">
              <label class="form-label text-xs">Icône</label>
              <app-emoji-picker [value]="newSub.icon || ''" (picked)="newSub.icon = $event" />
            </div>
            @if (subError()) {
              <p class="text-xs" style="color:#dc2626">{{ subError() }}</p>
            }
            <button type="button" (click)="addSub()" [disabled]="addingSubcat()"
              class="btn-primary text-sm py-2 px-5">
              @if (addingSubcat()) { ⏳ } @else { + Ajouter }
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CategoryFormComponent implements OnInit {
  private categorySvc    = inject(CategoryService);
  private subcategorySvc = inject(SubcategoryService);
  private route          = inject(ActivatedRoute);
  private router         = inject(Router);

  protected isEdit      = signal(false);
  protected saving      = signal(false);
  protected error       = signal('');
  protected form: Partial<Category> = { name_fr: '', description: '', icon: '🏥' };
  protected subcategories = signal<Subcategory[]>([]);
  protected addingSubcat  = signal(false);
  protected subError      = signal('');
  protected newSub: Partial<Subcategory> = { name_fr: '', icon: '📂' };

  private editId: string | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.editId = id;
      const cat = await this.categorySvc.getById(id);
      if (cat) this.form = { ...cat };
      this.loadSubcategories();
    }
  }

  private loadSubcategories(): void {
    if (!this.editId) return;
    this.subcategorySvc.getByCategory(this.editId).subscribe(list => this.subcategories.set(list));
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    try {
      if (this.isEdit() && this.editId) {
        await this.categorySvc.update(this.editId, this.form);
      } else {
        await this.categorySvc.add(this.form as Category);
      }
      this.router.navigate(['/admin/categories']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erreur');
    } finally {
      this.saving.set(false);
    }
  }

  async addSub(): Promise<void> {
    if (!this.newSub.name_fr?.trim()) { this.subError.set('Le nom est requis.'); return; }
    this.addingSubcat.set(true);
    this.subError.set('');
    try {
      await this.subcategorySvc.add({
        category_id: this.editId!,
        name_fr: this.newSub.name_fr!.trim(),
        name_ar: '', name_en: '',
        icon: this.newSub.icon ?? '📂',
      });
      this.newSub = { name_fr: '', icon: '📂' };
      await this.loadSubcategories();
    } catch (e: any) {
      this.subError.set(e.message ?? 'Erreur');
    } finally {
      this.addingSubcat.set(false);
    }
  }

  async deleteSub(sub: Subcategory): Promise<void> {
    if (!confirm(`Supprimer "${sub.name_fr}" ?`)) return;
    await this.subcategorySvc.delete(sub.id!);
    this.subcategories.update(list => list.filter(s => s.id !== sub.id));
  }
}
