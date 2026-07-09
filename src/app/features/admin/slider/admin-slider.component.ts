import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SliderService } from '../../../core/services/slider.service';
import { SliderImage } from '../../../core/models/slider.model';

@Component({
  selector: 'app-admin-slider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .slide-card { transition: box-shadow 0.2s; }
    .slide-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
    .img-drop.drag-over { border-color: var(--primary) !important; background: var(--primary-light) !important; }
  `],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-extrabold" style="color:var(--text-primary)">Slider principal</h1>
          <p class="text-sm mt-0.5" style="color:var(--text-secondary)">
            {{ slides().length }} image(s) · Les images actives apparaissent en page d'accueil
          </p>
        </div>
        <button (click)="openForm()" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Ajouter une image
        </button>
      </div>

      <!-- Upload / Edit form -->
      @if (showForm()) {
        <div class="card p-6 space-y-5" style="border:2px solid var(--primary)">
          <div class="flex items-center justify-between">
            <h2 class="font-bold text-base" style="color:var(--text-primary)">
              {{ editingId() ? 'Modifier la diapositive' : 'Nouvelle diapositive' }}
            </h2>
            <button (click)="closeForm()"
              class="w-8 h-8 rounded-xl flex items-center justify-center"
              style="border:1px solid var(--border);color:var(--text-secondary)">✕</button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- Left: image upload -->
            <div class="space-y-3">
              <label class="form-label">Image *</label>

              <!-- Drop zone -->
              <label class="img-drop block w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                style="border-color:var(--border);background:var(--bg-secondary);aspect-ratio:16/7"
                (dragover)="$event.preventDefault(); $any($event.currentTarget).classList.add('drag-over')"
                (dragleave)="$any($event.currentTarget).classList.remove('drag-over')"
                (drop)="onDrop($event)">
                @if (previewUrl()) {
                  <img [src]="previewUrl()" class="w-full h-full object-cover rounded-2xl" />
                } @else if (form.image_url) {
                  <img [src]="form.image_url" class="w-full h-full object-cover rounded-2xl" />
                } @else {
                  <div class="flex flex-col items-center justify-center h-full gap-3 p-6">
                    <svg class="w-12 h-12" style="color:var(--text-secondary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <p class="text-sm font-medium" style="color:var(--text-secondary)">
                      Glisser-déposer ou <span style="color:var(--primary)">choisir un fichier</span>
                    </p>
                    <p class="text-xs" style="color:var(--text-secondary)">PNG, JPG, WebP · Recommandé : 1920×700px</p>
                  </div>
                }
                <input type="file" accept="image/*" class="hidden" (change)="onFileSelect($any($event.target).files[0])" />
              </label>

              @if (uploading()) {
                <div class="flex items-center gap-2 text-sm" style="color:var(--primary)">
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Upload en cours…
                </div>
              }
            </div>

            <!-- Right: metadata fields -->
            <div class="space-y-4">
              <div class="form-field">
                <label class="form-label">Titre (optionnel)</label>
                <input type="text" [(ngModel)]="form.title" class="form-input"
                  placeholder="Ex: Nouveau catalogue 2026" />
              </div>
              <div class="form-field">
                <label class="form-label">Sous-titre (optionnel)</label>
                <input type="text" [(ngModel)]="form.subtitle" class="form-input"
                  placeholder="Ex: Découvrez nos offres exclusives" />
              </div>
              <div class="form-field">
                <label class="form-label">Lien (optionnel)</label>
                <input type="text" [(ngModel)]="form.link_url" class="form-input"
                  placeholder="/products ou URL externe" />
              </div>
              <div class="form-field">
                <label class="form-label">Texte du bouton</label>
                <input type="text" [(ngModel)]="form.link_label" class="form-input"
                  placeholder="Ex: Voir les produits" />
              </div>
              <div class="flex items-center gap-3">
                <label class="form-label mb-0">Ordre d'affichage</label>
                <input type="number" [(ngModel)]="form.sort_order" min="0" class="form-input w-20 text-center" />
              </div>
              <label class="flex items-center gap-3 cursor-pointer select-none">
                <div class="relative">
                  <input type="checkbox" [(ngModel)]="form.active" class="sr-only" />
                  <div class="w-11 h-6 rounded-full transition-colors"
                    [style.background]="form.active ? 'var(--primary)' : 'var(--border)'"></div>
                  <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    [style.transform]="form.active ? 'translateX(20px)' : 'translateX(0)'"></div>
                </div>
                <span class="text-sm font-medium" style="color:var(--text-primary)">
                  {{ form.active ? 'Active (visible en page d\'accueil)' : 'Inactive (masquée)' }}
                </span>
              </label>
            </div>
          </div>

          @if (formError()) {
            <div class="p-3 rounded-xl text-sm" style="background:#fee2e2;color:#dc2626">⚠ {{ formError() }}</div>
          }

          <div class="flex gap-3 pt-2">
            <button (click)="save()" [disabled]="saving() || uploading()"
              class="btn-primary py-2.5 px-6 flex items-center gap-2"
              [class.opacity-60]="saving() || uploading()">
              @if (saving()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              }
              {{ editingId() ? '💾 Sauvegarder' : '✅ Ajouter au slider' }}
            </button>
            <button (click)="closeForm()" class="btn-secondary py-2.5 px-6">Annuler</button>
          </div>
        </div>
      }

      <!-- Slides grid -->
      @if (slides().length === 0 && !showForm()) {
        <div class="card p-16 text-center">
          <div class="text-5xl mb-4">🖼️</div>
          <p class="font-bold text-base mb-1" style="color:var(--text-primary)">Aucune image dans le slider</p>
          <p class="text-sm mb-5" style="color:var(--text-secondary)">Ajoutez des images qui s'afficheront en page d'accueil.</p>
          <button (click)="openForm()" class="btn-primary">+ Ajouter une image</button>
        </div>
      }

      @if (slides().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          @for (slide of slides(); track slide.id) {
            <div class="slide-card card overflow-hidden">
              <!-- Preview -->
              <div class="relative group" style="aspect-ratio:16/7">
                <img [src]="slide.image_url" class="w-full h-full object-cover" [alt]="slide.title || 'Slide'" />

                <!-- Overlay on hover -->
                <div class="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  style="background:rgba(0,0,0,0.5)">
                  <button (click)="editSlide(slide)"
                    class="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                    style="background:var(--primary)">
                    ✏️ Modifier
                  </button>
                  <button (click)="deleteSlide(slide)"
                    class="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style="background:#dc2626;color:white">
                    🗑️ Supprimer
                  </button>
                </div>

                <!-- Active badge -->
                <div class="absolute top-2 right-2">
                  @if (slide.active) {
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold" style="background:#16a34a;color:white">● Actif</span>
                  } @else {
                    <span class="px-2 py-0.5 rounded-full text-xs font-bold" style="background:#94a3b8;color:white">○ Inactif</span>
                  }
                </div>

                <!-- Sort order badge -->
                <div class="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style="background:rgba(0,0,0,0.6)">
                  {{ slide.sort_order }}
                </div>
              </div>

              <!-- Info bar -->
              <div class="px-4 py-3 flex items-center gap-3">
                <div class="flex-1 min-w-0">
                  @if (slide.title) {
                    <p class="font-semibold text-sm truncate" style="color:var(--text-primary)">{{ slide.title }}</p>
                  }
                  @if (slide.subtitle) {
                    <p class="text-xs truncate" style="color:var(--text-secondary)">{{ slide.subtitle }}</p>
                  }
                  @if (!slide.title && !slide.subtitle) {
                    <p class="text-xs italic" style="color:var(--text-secondary)">Aucun texte d'overlay</p>
                  }
                </div>

                <!-- Quick toggle active -->
                <button (click)="toggleActive(slide)"
                  class="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                  [style.background]="slide.active ? '#dcfce7' : '#f1f5f9'"
                  [style.color]="slide.active ? '#16a34a' : '#64748b'">
                  {{ slide.active ? 'Désactiver' : 'Activer' }}
                </button>

                <!-- Sort controls -->
                <div class="flex flex-col gap-0.5 shrink-0">
                  <button (click)="moveUp(slide)"
                    class="w-5 h-5 rounded flex items-center justify-center text-xs hover:bg-slate-100"
                    style="color:var(--text-secondary)" [disabled]="slide.sort_order === 0">▲</button>
                  <button (click)="moveDown(slide)"
                    class="w-5 h-5 rounded flex items-center justify-center text-xs hover:bg-slate-100"
                    style="color:var(--text-secondary)">▼</button>
                </div>
              </div>
            </div>
          }
        </div>
      }

    </div>
  `,
})
export class AdminSliderComponent {
  private sliderSvc = inject(SliderService);

  protected slides    = signal<SliderImage[]>([]);
  protected showForm  = signal(false);
  protected editingId = signal<number | string | null>(null);
  protected uploading = signal(false);
  protected saving    = signal(false);
  protected formError = signal('');
  protected previewUrl = signal('');

  protected form = this.blankForm();

  constructor() { this.load(); }

  private load(): void {
    this.sliderSvc.getAll().subscribe(list => this.slides.set(list));
  }

  openForm(): void {
    this.form = this.blankForm();
    this.editingId.set(null);
    this.previewUrl.set('');
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.previewUrl.set('');
    this.formError.set('');
  }

  editSlide(slide: SliderImage): void {
    this.form = {
      title:      slide.title ?? '',
      subtitle:   slide.subtitle ?? '',
      image_url:  slide.image_url,
      link_url:   slide.link_url ?? '',
      link_label: slide.link_label ?? '',
      sort_order: slide.sort_order,
      active:     slide.active,
    };
    this.editingId.set(slide.id!);
    this.previewUrl.set('');
    this.formError.set('');
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── File handling ─────────────────────────────────────────────

  onDrop(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  onFileSelect(file: File | null): void {
    if (file) this.uploadFile(file);
  }

  private async uploadFile(file: File): Promise<void> {
    this.uploading.set(true);
    this.formError.set('');
    try {
      // Local preview
      const reader = new FileReader();
      reader.onload = e => this.previewUrl.set(e.target?.result as string);
      reader.readAsDataURL(file);
      // Upload to storage
      const url = await this.sliderSvc.uploadImage(file);
      this.form.image_url = url;
    } catch (e: any) {
      this.formError.set(e.message ?? 'Erreur lors de l\'upload.');
    } finally {
      this.uploading.set(false);
    }
  }

  // ── Save ──────────────────────────────────────────────────────

  async save(): Promise<void> {
    if (!this.form.image_url) { this.formError.set('Veuillez choisir une image.'); return; }
    this.saving.set(true);
    this.formError.set('');
    try {
      if (this.editingId()) {
        await this.sliderSvc.update(this.editingId()!, this.form);
      } else {
        await this.sliderSvc.add({ ...this.form, sort_order: this.slides().length });
      }
      this.load();
      this.closeForm();
    } catch (e: any) {
      this.formError.set(e.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      this.saving.set(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────

  async deleteSlide(slide: SliderImage): Promise<void> {
    if (!confirm(`Supprimer cette image du slider ?`)) return;
    try {
      await this.sliderSvc.delete(slide.id!, slide.image_url);
      this.slides.update(list => list.filter(s => s.id !== slide.id));
    } catch (e: any) {
      alert(e.message ?? 'Erreur lors de la suppression.');
    }
  }

  // ── Toggle active ─────────────────────────────────────────────

  async toggleActive(slide: SliderImage): Promise<void> {
    const next = !slide.active;
    this.slides.update(list => list.map(s => s.id === slide.id ? { ...s, active: next } : s));
    await this.sliderSvc.update(slide.id!, { active: next });
  }

  // ── Reorder ───────────────────────────────────────────────────

  async moveUp(slide: SliderImage): Promise<void> {
    const list = [...this.slides()].sort((a, b) => a.sort_order - b.sort_order);
    const idx  = list.findIndex(s => s.id === slide.id);
    if (idx <= 0) return;
    await this.swap(list[idx - 1], list[idx]);
  }

  async moveDown(slide: SliderImage): Promise<void> {
    const list = [...this.slides()].sort((a, b) => a.sort_order - b.sort_order);
    const idx  = list.findIndex(s => s.id === slide.id);
    if (idx >= list.length - 1) return;
    await this.swap(list[idx], list[idx + 1]);
  }

  private async swap(a: SliderImage, b: SliderImage): Promise<void> {
    await Promise.all([
      this.sliderSvc.update(a.id!, { sort_order: b.sort_order }),
      this.sliderSvc.update(b.id!, { sort_order: a.sort_order }),
    ]);
    this.load();
  }

  // ── Helpers ───────────────────────────────────────────────────

  private blankForm(): Omit<SliderImage, 'id' | 'created_at'> {
    return { title: '', subtitle: '', image_url: '', link_url: '', link_label: '', sort_order: 0, active: true };
  }
}
