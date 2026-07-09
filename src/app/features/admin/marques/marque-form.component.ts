import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarqueService } from '../../../core/services/marque.service';
import { Marque } from '../../../core/models/marque.model';

@Component({
  selector: 'app-marque-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-xl space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-4">
        <a routerLink="/admin/marques"
          class="w-9 h-9 flex items-center justify-center rounded-xl"
          style="border: 1px solid var(--border)">
          <svg class="w-4 h-4" style="color: var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <h1 class="text-2xl font-extrabold" style="color: var(--text-primary)">
          {{ isEdit() ? '✏️ Modifier la marque' : '➕ Nouvelle marque' }}
        </h1>
      </div>

      <form (ngSubmit)="save()" class="space-y-5">

        <!-- Image upload -->
        <div class="card p-6 space-y-4">
          <h2 class="font-bold" style="color: var(--text-primary)">🖼️ Logo / Image</h2>

          <!-- Preview -->
          <div class="flex items-center gap-5">
            <div class="w-28 h-28 rounded-2xl overflow-hidden flex items-center justify-center shrink-0"
              style="background: var(--bg-secondary); border: 2px dashed var(--border)">
              @if (uploading()) {
                <div class="text-center">
                  <div class="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-1"
                    style="border-color: var(--primary); border-top-color: transparent"></div>
                  <p class="text-xs" style="color: var(--text-secondary)">{{ uploadProgress() }}%</p>
                </div>
              } @else if (form.image) {
                <img [src]="form.image" class="w-full h-full object-contain p-3" />
              } @else {
                <span class="text-4xl opacity-25">🏷️</span>
              }
            </div>

            <div class="space-y-2 flex-1">
              <label
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer text-sm font-medium transition-colors"
                style="background: var(--primary-light); color: var(--primary); border: 1.5px solid var(--primary)"
                [class.opacity-50]="uploading()">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                {{ uploading() ? 'Envoi en cours…' : 'Choisir une image' }}
                <input type="file" accept="image/*" class="hidden"
                  [disabled]="uploading()"
                  (change)="onFilePicked($event)" />
              </label>
              @if (form.image) {
                <button type="button" (click)="form.image = ''"
                  class="text-xs font-medium"
                  style="color: #dc2626">✕ Supprimer l'image</button>
              }
              <p class="text-xs" style="color: var(--text-secondary)">PNG, JPG, WebP — max 5 Mo</p>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="card p-6 space-y-4">
          <h2 class="font-bold" style="color: var(--text-primary)">📝 Informations</h2>

          <div class="form-field">
            <label class="form-label">Nom de la marque *</label>
            <input type="text" [(ngModel)]="form.name" name="name"
              required placeholder="Ex: Doliprane, Bayer, Sanofi…"
              class="form-input" />
          </div>

          <div class="form-field">
            <label class="form-label">Description</label>
            <textarea [(ngModel)]="form.description" name="description"
              rows="3" placeholder="Courte description de la marque…"
              class="form-input resize-none"></textarea>
          </div>
        </div>

        @if (error()) {
          <div class="rounded-xl p-4 text-sm" style="background:#fee2e2;color:#dc2626">⚠ {{ error() }}</div>
        }

        <div class="flex gap-3">
          <button type="submit"
            [disabled]="saving() || uploading()"
            class="btn-primary py-3 px-8 flex items-center gap-2"
            [class.opacity-60]="saving() || uploading()">
            @if (saving()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            }
            {{ isEdit() ? '💾 Sauvegarder' : '✅ Créer la marque' }}
          </button>
          <a routerLink="/admin/marques" class="btn-secondary py-3 px-8">Annuler</a>
        </div>

      </form>
    </div>
  `,
})
export class MarqueFormComponent implements OnInit {
  private marqueSvc = inject(MarqueService);
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);

  protected isEdit        = signal(false);
  protected saving        = signal(false);
  protected uploading     = signal(false);
  protected uploadProgress = signal(0);
  protected error         = signal('');

  protected form: Partial<Marque> = { name: '', description: '', image: '' };

  private editId: string | null = null;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.editId = id;
      const m = await this.marqueSvc.getById(id);
      if (m) this.form = { ...m };
    }
  }

  async onFilePicked(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.error.set('L\'image ne doit pas dépasser 5 Mo.'); return; }

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.error.set('');

    const timer = setInterval(() => {
      this.uploadProgress.update(p => Math.min(p + 15, 85));
    }, 200);

    try {
      const url = await this.marqueSvc.uploadImage(file);
      this.form.image = url;
      this.uploadProgress.set(100);
    } catch (e: any) {
      this.error.set(`Erreur upload: ${e.message}`);
    } finally {
      clearInterval(timer);
      this.uploading.set(false);
    }
  }

  async save(): Promise<void> {
    if (!this.form.name?.trim()) { this.error.set('Le nom est obligatoire.'); return; }
    this.saving.set(true);
    this.error.set('');
    try {
      const payload = {
        name:        this.form.name!.trim(),
        description: this.form.description?.trim() ?? '',
        image:       this.form.image ?? '',
      };
      if (this.isEdit() && this.editId) {
        await this.marqueSvc.update(this.editId, payload);
      } else {
        await this.marqueSvc.add(payload);
      }
      this.router.navigate(['/admin/marques']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Erreur lors de l\'enregistrement.');
    } finally {
      this.saving.set(false);
    }
  }
}
