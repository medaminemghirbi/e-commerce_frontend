import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AstuceService } from '../../../core/services/astuce.service';
import { Astuce } from '../../../core/models/astuce.model';

@Component({
  selector: 'app-admin-astuces-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-extrabold" style="color:var(--text-primary)">💡 Astuces</h1>
        <a routerLink="/admin/astuces/new" class="btn-primary">+ Nouvelle astuce</a>
      </div>

      <div class="card overflow-hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Produit lié</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (a of astuces(); track a.id) {
              <tr>
                <td>
                  <div class="w-12 h-12 rounded-xl overflow-hidden" style="background:var(--bg-secondary)">
                    @if (a.images.length) {
                      <img [src]="a.images[0]" class="w-full h-full object-cover" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center text-xl opacity-30">💡</div>
                    }
                  </div>
                </td>
                <td>
                  <div class="font-medium max-w-xs" style="color:var(--text-primary)">{{ a.title }}</div>
                  @if (a.description) {
                    <div class="text-xs max-w-xs truncate mt-0.5" style="color:var(--text-secondary)">{{ a.description }}</div>
                  }
                </td>
                <td><span class="badge badge-primary">{{ a.category }}</span></td>
                <td style="color:var(--text-secondary)">{{ a.product_name || '—' }}</td>
                <td>
                  <span class="badge" [class.badge-success]="a.active" [class.badge-danger]="!a.active">
                    {{ a.active ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <a [routerLink]="['/admin/astuces', a.id, 'edit']" class="btn-secondary text-xs px-3 py-1">Modifier</a>
                    <button class="btn-danger text-xs px-3 py-1" (click)="remove(a.id!)">Supprimer</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="text-center py-12" style="color:var(--text-secondary)">
                  Aucune astuce. <a routerLink="/admin/astuces/new" style="color:var(--primary)">Créez-en une !</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminAstucesListComponent implements OnInit {
  private astuceSvc = inject(AstuceService);
  protected astuces = signal<Astuce[]>([]);

  ngOnInit(): void { this.load(); }
  private load(): void { this.astuceSvc.adminGetAll().subscribe(d => this.astuces.set(d)); }

  protected remove(id: number): void {
    if (!confirm('Supprimer cette astuce ?')) return;
    this.astuceSvc.delete(id).subscribe(() => this.load());
  }
}
