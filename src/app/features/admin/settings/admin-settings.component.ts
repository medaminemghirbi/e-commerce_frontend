import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { SliderService } from '../../../core/services/slider.service';
import { SliderImage } from '../../../core/models/slider.model';
import { ToastService } from '../../../core/services/toast.service';
import { ProgressService } from '../../../core/services/progress.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .img-drop.drag-over { border-color: var(--primary) !important; background: color-mix(in srgb, var(--primary) 8%, transparent) !important; }
    .slide-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
  `],
  template: `
    <div class="space-y-6">

      <!-- Page header -->
      <div>
        <h1 class="text-2xl font-extrabold" style="color:var(--text-primary)">⚙️ Paramètres du site</h1>
        <p class="text-sm mt-0.5" style="color:var(--text-secondary)">Tarification et gestion du slider principal</p>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 p-1 rounded-2xl w-fit" style="background:var(--bg-secondary)">
        <button
          (click)="activeTab.set('settings')"
          class="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          [style.background]="activeTab() === 'settings' ? 'var(--bg-card)' : 'transparent'"
          [style.color]="activeTab() === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)'"
          [style.boxShadow]="activeTab() === 'settings' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'">
          💰 Paramètres
        </button>
        <button
          (click)="activeTab.set('slider')"
          class="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
          [style.background]="activeTab() === 'slider' ? 'var(--bg-card)' : 'transparent'"
          [style.color]="activeTab() === 'slider' ? 'var(--text-primary)' : 'var(--text-secondary)'"
          [style.boxShadow]="activeTab() === 'slider' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'">
          🖼️ Slider
          @if (slides().length > 0) {
            <span class="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
              style="background:var(--primary);color:white">{{ slides().length }}</span>
          }
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════ -->
      <!-- TAB: PARAMÈTRES                                        -->
      <!-- ═══════════════════════════════════════════════════════ -->
      @if (activeTab() === 'settings') {
        <div class="max-w-2xl space-y-6">

          <!-- Pricing settings -->
          <div class="card p-6 space-y-6">
            <h2 class="font-bold text-lg" style="color:var(--text-primary)">💰 Tarification</h2>

            <!-- Margin -->
            <div>
              <label class="form-label mb-1">
                Marge bénéficiaire (%)
                <span class="ml-2 font-bold" style="color:var(--primary)">{{ margin() }}%</span>
              </label>
              <input type="range" min="1" max="100" step="1"
                [value]="margin()" (input)="margin.set(+$any($event.target).value)"
                class="w-full mb-2" style="accent-color:var(--primary)" />
              <div class="flex justify-between text-xs" style="color:var(--text-secondary)">
                <span>1%</span><span>100%</span>
              </div>
              <div class="mt-4 rounded-xl p-4 space-y-2" style="background:var(--bg-secondary)">
                <p class="text-sm font-semibold" style="color:var(--text-primary)">Aperçu pour un achat à 100 TND :</p>
                <div class="flex items-center justify-between text-sm">
                  <span style="color:var(--text-secondary)">Prix d'achat</span>
                  <span class="font-medium">100.00 TND</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span style="color:var(--text-secondary)">Prix de vente</span>
                  <span class="font-bold" style="color:var(--primary)">{{ sellingPreview() }} TND</span>
                </div>
                <div class="flex items-center justify-between text-sm border-t pt-2" style="border-color:var(--border)">
                  <span style="color:var(--text-secondary)">Bénéfice net</span>
                  <span class="font-bold" style="color:#16a34a">+{{ profitPreview() }} TND</span>
                </div>
              </div>
            </div>

            <!-- Promotion discount -->
            <div>
              <label class="form-label mb-1">
                Remise promotion (produits proches d'expiration) (%)
                <span class="ml-2 font-bold" style="color:#f59e0b">{{ promotion() }}%</span>
              </label>
              <input type="range" min="1" max="80" step="1"
                [value]="promotion()" (input)="promotion.set(+$any($event.target).value)"
                class="w-full mb-2" style="accent-color:#f59e0b" />
              <div class="flex justify-between text-xs" style="color:var(--text-secondary)">
                <span>1%</span><span>80%</span>
              </div>
              <div class="mt-4 rounded-xl p-4 space-y-2" style="background:var(--bg-secondary)">
                <p class="text-sm font-semibold" style="color:var(--text-primary)">Aperçu promotion sur 100 TND de vente :</p>
                <div class="flex items-center justify-between text-sm">
                  <span style="color:var(--text-secondary)">Prix normal</span>
                  <span class="font-medium">100.00 TND</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span style="color:var(--text-secondary)">Après remise {{ promotion() }}%</span>
                  <span class="font-bold" style="color:#f59e0b">{{ promoPreview() }} TND</span>
                </div>
              </div>
            </div>

            <button (click)="saveSettings()" [disabled]="savingSettings()" class="btn-primary py-3 px-8 w-full">
              @if (savingSettings()) { ⏳ Mise à jour des produits... } @else { 💾 Enregistrer et recalculer tous les produits }
            </button>
          </div>
        </div>
      }

      <!-- ═══════════════════════════════════════════════════════ -->
      <!-- TAB: SLIDER                                            -->
      <!-- ═══════════════════════════════════════════════════════ -->
      @if (activeTab() === 'slider') {
        <div class="space-y-5">

          <!-- Slider header -->
          <div class="flex items-center justify-between flex-wrap gap-3">
            <p class="text-sm" style="color:var(--text-secondary)">
              {{ slides().length }} image(s) · Les images actives apparaissent en page d'accueil
            </p>
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
                  <label class="img-drop block w-full rounded-2xl border-2 border-dashed cursor-pointer transition-all"
                    style="border-color:var(--border);background:var(--bg-secondary);aspect-ratio:16/7"
                    (dragover)="$event.preventDefault(); $any($event.currentTarget).classList.add('drag-over')"
                    (dragleave)="$any($event.currentTarget).classList.remove('drag-over')"
                    (drop)="onDrop($event)">
                    @if (previewUrl()) {
                      <img [src]="previewUrl()" class="w-full h-full object-cover rounded-2xl" />
                    } @else if (sliderForm.image_url) {
                      <img [src]="sliderForm.image_url" class="w-full h-full object-cover rounded-2xl" />
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
                    <input type="text" [(ngModel)]="sliderForm.title" class="form-input"
                      placeholder="Ex: Nouveau catalogue 2026" />
                  </div>
                  <div class="form-field">
                    <label class="form-label">Sous-titre (optionnel)</label>
                    <input type="text" [(ngModel)]="sliderForm.subtitle" class="form-input"
                      placeholder="Ex: Découvrez nos offres exclusives" />
                  </div>
                  <div class="form-field">
                    <label class="form-label">Lien (optionnel)</label>
                    <input type="text" [(ngModel)]="sliderForm.link_url" class="form-input"
                      placeholder="/products ou URL externe" />
                  </div>
                  <div class="form-field">
                    <label class="form-label">Texte du bouton</label>
                    <input type="text" [(ngModel)]="sliderForm.link_label" class="form-input"
                      placeholder="Ex: Voir les produits" />
                  </div>
                  <div class="flex items-center gap-3">
                    <label class="form-label mb-0">Ordre d'affichage</label>
                    <input type="number" [(ngModel)]="sliderForm.sort_order" min="0" class="form-input w-20 text-center" />
                  </div>
                  <label class="flex items-center gap-3 cursor-pointer select-none">
                    <div class="relative">
                      <input type="checkbox" [(ngModel)]="sliderForm.active" class="sr-only" />
                      <div class="w-11 h-6 rounded-full transition-colors"
                        [style.background]="sliderForm.active ? 'var(--primary)' : 'var(--border)'"></div>
                      <div class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                        [style.transform]="sliderForm.active ? 'translateX(20px)' : 'translateX(0)'"></div>
                    </div>
                    <span class="text-sm font-medium" style="color:var(--text-primary)">
                      {{ sliderForm.active ? "Active (visible en page d'accueil)" : 'Inactive (masquée)' }}
                    </span>
                  </label>
                </div>
              </div>

              @if (formError()) {
                <div class="p-3 rounded-xl text-sm" style="background:#fee2e2;color:#dc2626">⚠ {{ formError() }}</div>
              }

              <div class="flex gap-3 pt-2">
                <button (click)="saveSlide()" [disabled]="savingSlide() || uploading()"
                  class="btn-primary py-2.5 px-6 flex items-center gap-2"
                  [class.opacity-60]="savingSlide() || uploading()">
                  @if (savingSlide()) {
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

          <!-- Empty state -->
          @if (slides().length === 0 && !showForm()) {
            <div class="card p-16 text-center">
              <div class="text-5xl mb-4">🖼️</div>
              <p class="font-bold text-base mb-1" style="color:var(--text-primary)">Aucune image dans le slider</p>
              <p class="text-sm mb-5" style="color:var(--text-secondary)">Ajoutez des images qui s'afficheront en page d'accueil.</p>
              <button (click)="openForm()" class="btn-primary">+ Ajouter une image</button>
            </div>
          }

          <!-- Slides grid -->
          @if (slides().length > 0) {
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              @for (slide of slides(); track slide.id) {
                <div class="slide-card card overflow-hidden transition-shadow">
                  <!-- Preview -->
                  <div class="relative group" style="aspect-ratio:16/7">
                    <img [src]="slide.image_url" class="w-full h-full object-cover" [alt]="slide.title || 'Slide'" />
                    <div class="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      style="background:rgba(0,0,0,0.5)">
                      <button (click)="editSlide(slide)"
                        class="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                        style="background:var(--primary)">✏️ Modifier</button>
                      <button (click)="deleteSlide(slide)"
                        class="px-3 py-1.5 rounded-lg text-sm font-medium"
                        style="background:#dc2626;color:white">🗑️ Supprimer</button>
                    </div>
                    <div class="absolute top-2 right-2">
                      @if (slide.active) {
                        <span class="px-2 py-0.5 rounded-full text-xs font-bold" style="background:#16a34a;color:white">● Actif</span>
                      } @else {
                        <span class="px-2 py-0.5 rounded-full text-xs font-bold" style="background:#94a3b8;color:white">○ Inactif</span>
                      }
                    </div>
                    <div class="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style="background:rgba(0,0,0,0.6)">{{ slide.sort_order }}</div>
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
                    <button (click)="toggleActive(slide)"
                      class="shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                      [style.background]="slide.active ? '#dcfce7' : '#f1f5f9'"
                      [style.color]="slide.active ? '#16a34a' : '#64748b'">
                      {{ slide.active ? 'Désactiver' : 'Activer' }}
                    </button>
                    <div class="flex flex-col gap-0.5 shrink-0">
                      <button (click)="moveUp(slide)" [disabled]="slide.sort_order === 0"
                        class="w-5 h-5 rounded flex items-center justify-center text-xs hover:bg-slate-100"
                        style="color:var(--text-secondary)">▲</button>
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
      }

    </div>
  `,
})
export class AdminSettingsComponent {
  private settingsSvc = inject(SettingsService);
  private sliderSvc   = inject(SliderService);
  private toast       = inject(ToastService);
  private progress    = inject(ProgressService);

  // ── Tab ───────────────────────────────────────────────────────
  protected activeTab = signal<'settings' | 'slider'>('settings');

  // ── Settings tab ──────────────────────────────────────────────
  protected margin        = signal(this.settingsSvc.marginPercent());
  protected promotion     = signal(this.settingsSvc.promotionPercent());
  protected savingSettings = signal(false);

  protected sellingPreview = computed(() => (100 * (1 + this.margin() / 100)).toFixed(2));
  protected profitPreview  = computed(() => (100 * this.margin() / 100).toFixed(2));
  protected promoPreview   = computed(() => (100 * (1 - this.promotion() / 100)).toFixed(2));

  async saveSettings(): Promise<void> {
    this.savingSettings.set(true);
    this.progress.start();
    try {
      await this.settingsSvc.save(this.margin(), this.promotion());
      this.toast.success('Paramètres enregistrés — tous les produits ont été recalculés.');
    } catch (e: any) {
      this.toast.error(e.message ?? 'Erreur lors de la mise à jour.');
    } finally {
      this.savingSettings.set(false);
      this.progress.complete();
    }
  }

  // ── Slider tab ────────────────────────────────────────────────
  protected slides     = signal<SliderImage[]>([]);
  protected showForm   = signal(false);
  protected editingId  = signal<number | string | null>(null);
  protected uploading  = signal(false);
  protected savingSlide = signal(false);
  protected formError  = signal('');
  protected previewUrl = signal('');
  protected sliderForm = this.blankForm();

  constructor() { this.loadSlides(); }

  private loadSlides(): void {
    this.sliderSvc.getAll().subscribe(list => this.slides.set(list));
  }

  openForm(): void {
    this.sliderForm = this.blankForm();
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
    this.sliderForm = {
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
  }

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
      const reader = new FileReader();
      reader.onload = e => this.previewUrl.set(e.target?.result as string);
      reader.readAsDataURL(file);
      this.sliderForm.image_url = await this.sliderSvc.uploadImage(file);
    } catch (e: any) {
      this.formError.set(e.message ?? "Erreur lors de l'upload.");
    } finally {
      this.uploading.set(false);
    }
  }

  async saveSlide(): Promise<void> {
    if (!this.sliderForm.image_url) { this.formError.set('Veuillez choisir une image.'); return; }
    this.savingSlide.set(true);
    this.formError.set('');
    try {
      if (this.editingId()) {
        await this.sliderSvc.update(this.editingId()!, this.sliderForm);
      } else {
        await this.sliderSvc.add({ ...this.sliderForm, sort_order: this.slides().length });
      }
      this.loadSlides();
      this.closeForm();
    } catch (e: any) {
      this.formError.set(e.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      this.savingSlide.set(false);
    }
  }

  async deleteSlide(slide: SliderImage): Promise<void> {
    if (!confirm('Supprimer cette image du slider ?')) return;
    try {
      await this.sliderSvc.delete(slide.id!, slide.image_url);
      this.slides.update(list => list.filter(s => s.id !== slide.id));
    } catch (e: any) {
      alert(e.message ?? 'Erreur lors de la suppression.');
    }
  }

  async toggleActive(slide: SliderImage): Promise<void> {
    const next = !slide.active;
    this.slides.update(list => list.map(s => s.id === slide.id ? { ...s, active: next } : s));
    await this.sliderSvc.update(slide.id!, { active: next });
  }

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
    this.loadSlides();
  }

  private blankForm(): Omit<SliderImage, 'id' | 'created_at'> {
    return { title: '', subtitle: '', image_url: '', link_url: '', link_label: '', sort_order: 0, active: true };
  }
}
