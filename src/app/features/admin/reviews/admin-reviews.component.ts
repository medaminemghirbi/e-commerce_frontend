import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../../core/services/review.service';
import { Review } from '../../../core/models/review.model';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-extrabold" style="color:var(--text-primary)">⭐ Avis clients</h1>
        <div class="flex gap-2">
          @for (f of filters; track f.value) {
            <button
              (click)="filter.set(f.value)"
              class="px-4 py-2 rounded-xl text-sm font-medium border transition-all"
              [style.background]="filter() === f.value ? 'var(--primary)' : 'var(--bg-card)'"
              [style.color]="filter() === f.value ? 'white' : 'var(--text-secondary)'"
              [style.border-color]="filter() === f.value ? 'var(--primary)' : 'var(--border)'"
            >{{ f.label }}</button>
          }
        </div>
      </div>

      <div class="card overflow-hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Commande</th>
              <th>Note</th>
              <th>Commentaire</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (r of visible(); track r.id) {
              <tr>
                <td>
                  <div class="font-medium" style="color:var(--text-primary)">{{ r.first_name }}</div>
                  <div class="text-xs" style="color:var(--text-secondary)">{{ r.user_email }}</div>
                </td>
                <td style="color:var(--text-secondary)">#{{ r.order_id }}</td>
                <td>
                  <div class="flex gap-0.5">
                    @for (s of [1,2,3,4,5]; track s) {
                      <span [style.color]="s <= r.rating ? '#f59e0b' : 'var(--border)'">★</span>
                    }
                  </div>
                </td>
                <td class="max-w-xs">
                  <p class="text-sm truncate" style="color:var(--text-secondary)">{{ r.comment || '—' }}</p>
                </td>
                <td class="text-sm" style="color:var(--text-secondary)">{{ r.created_at | date:'dd/MM/yyyy' }}</td>
                <td>
                  <span class="badge" [class.badge-success]="r.published" [class.badge-warning]="!r.published">
                    {{ r.published ? 'Publié' : 'En attente' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button
                      class="text-xs px-3 py-1 rounded-lg font-medium transition-all"
                      [style.background]="r.published ? 'var(--bg)' : 'var(--primary)'"
                      [style.color]="r.published ? 'var(--text-secondary)' : 'white'"
                      style="border:1px solid var(--border)"
                      (click)="toggle(r)"
                    >{{ r.published ? 'Masquer' : 'Publier' }}</button>
                    <button class="btn-danger text-xs px-3 py-1" (click)="remove(r.id!)">Supprimer</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="text-center py-12" style="color:var(--text-secondary)">Aucun avis.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminReviewsComponent implements OnInit {
  private reviewSvc = inject(ReviewService);

  protected reviews = signal<Review[]>([]);
  protected filter  = signal<'all' | 'published' | 'pending'>('all');

  protected filters = [
    { value: 'all' as const,       label: 'Tous' },
    { value: 'published' as const, label: 'Publiés' },
    { value: 'pending' as const,   label: 'En attente' },
  ];

  protected visible = () => {
    const f = this.filter();
    if (f === 'published') return this.reviews().filter(r => r.published);
    if (f === 'pending')   return this.reviews().filter(r => !r.published);
    return this.reviews();
  };

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.reviewSvc.getAll().subscribe(data => this.reviews.set(data));
  }

  protected toggle(r: Review): void {
    this.reviewSvc.togglePublish(r.id!, !r.published).subscribe(() => this.load());
  }

  protected remove(id: number): void {
    if (!confirm('Supprimer cet avis ?')) return;
    this.reviewSvc.delete(id).subscribe(() => this.load());
  }
}
