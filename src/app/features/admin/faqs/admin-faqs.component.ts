import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaqService } from '../../../core/services/faq.service';
import { Faq } from '../../../core/models/faq.model';

const EMPTY_FORM = (): Partial<Faq> => ({
  question: '', answer: '', category: 'Général', sort_order: 0, active: true
});

@Component({
  selector: 'app-admin-faqs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-extrabold" style="color: var(--text-primary)">FAQ</h1>
        <button class="btn-primary" (click)="openForm()">+ Ajouter</button>
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Catégorie</th>
              <th>Ordre</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (f of faqs(); track f.id) {
              <tr>
                <td>
                  <div class="font-medium max-w-xs truncate" style="color: var(--text-primary)">{{ f.question }}</div>
                  <div class="text-xs max-w-xs truncate mt-0.5" style="color: var(--text-secondary)">{{ f.answer }}</div>
                </td>
                <td>
                  <span class="badge badge-primary">{{ f.category }}</span>
                </td>
                <td style="color: var(--text-secondary)">{{ f.sort_order }}</td>
                <td>
                  <span class="badge" [class.badge-success]="f.active" [class.badge-danger]="!f.active">
                    {{ f.active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button class="btn-secondary text-xs px-3 py-1" (click)="edit(f)">Modifier</button>
                    <button class="btn-danger text-xs px-3 py-1" (click)="remove(f.id)">Supprimer</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="text-center py-12" style="color: var(--text-secondary)">
                  Aucune FAQ. Ajoutez-en une !
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background: rgba(0,0,0,0.5)">
          <div class="card w-full max-w-lg p-6 space-y-4">
            <h2 class="text-xl font-bold" style="color: var(--text-primary)">
              {{ editingId() ? 'Modifier la FAQ' : 'Nouvelle FAQ' }}
            </h2>

            <div class="form-field">
              <label class="form-label">Question *</label>
              <input [(ngModel)]="form.question" type="text" class="form-input" placeholder="ex: Quel est le délai de livraison ?" />
            </div>

            <div class="form-field">
              <label class="form-label">Réponse *</label>
              <textarea [(ngModel)]="form.answer" rows="4" class="form-input resize-none" placeholder="Réponse détaillée..."></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-field">
                <label class="form-label">Catégorie</label>
                <select [(ngModel)]="form.category" class="form-input">
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">Ordre</label>
                <input [(ngModel)]="form.sort_order" type="number" class="form-input" min="0" />
              </div>
            </div>

            <div class="flex items-center gap-3">
              <input [(ngModel)]="form.active" type="checkbox" id="faq-active" class="w-4 h-4" />
              <label for="faq-active" class="text-sm font-medium" style="color: var(--text-primary)">Actif</label>
            </div>

            @if (error()) {
              <p class="text-sm text-red-500">{{ error() }}</p>
            }

            <div class="flex gap-3 pt-2">
              <button class="btn-primary flex-1" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
              <button class="btn-secondary flex-1" (click)="closeForm()">Annuler</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export class AdminFaqsComponent implements OnInit {
  private faqSvc = inject(FaqService);

  protected faqs    = signal<Faq[]>([]);
  protected showForm = signal(false);
  protected saving   = signal(false);
  protected error    = signal('');
  protected editingId = signal<number | null>(null);
  protected form: Partial<Faq> = EMPTY_FORM();

  protected categories = ['Général', 'Livraison', 'Paiement', 'Produits', 'Retours', 'Compte'];

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.faqSvc.getAll().subscribe(data => this.faqs.set(data));
  }

  protected openForm(): void {
    this.form = EMPTY_FORM();
    this.editingId.set(null);
    this.error.set('');
    this.showForm.set(true);
  }

  protected edit(f: Faq): void {
    this.form = { question: f.question, answer: f.answer, category: f.category, sort_order: f.sort_order, active: f.active };
    this.editingId.set(f.id);
    this.error.set('');
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
  }

  protected save(): void {
    if (!this.form.question?.trim() || !this.form.answer?.trim()) {
      this.error.set('La question et la réponse sont obligatoires.');
      return;
    }
    this.saving.set(true);
    const req = this.editingId()
      ? this.faqSvc.update(this.editingId()!, this.form)
      : this.faqSvc.create(this.form);

    req.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: () => { this.saving.set(false); this.error.set('Une erreur est survenue.'); },
    });
  }

  protected remove(id: number): void {
    if (!confirm('Supprimer cette FAQ ?')) return;
    this.faqSvc.delete(id).subscribe(() => this.load());
  }
}
