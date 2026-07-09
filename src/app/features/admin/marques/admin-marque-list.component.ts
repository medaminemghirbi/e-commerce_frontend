import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MarqueService } from '../../../core/services/marque.service';
import { Marque } from '../../../core/models/marque.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-marque-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-extrabold flex items-center gap-3" style="color: var(--text-primary)">
            🏷️ Marques
            <span class="text-sm font-semibold px-2.5 py-0.5 rounded-full"
              style="background: var(--primary-light); color: var(--primary)">
              {{ filtered().length }} / {{ marques().length }}
            </span>
          </h1>
          <p class="text-sm mt-1" style="color: var(--text-secondary)">Gérez les marques de vos produits</p>
        </div>
        <a routerLink="/admin/marques/new" class="btn-primary flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nouvelle marque
        </a>
      </div>

      <!-- Search -->
      <div class="card p-4">
        <input
          type="text"
          [ngModel]="search()"
          (ngModelChange)="search.set($event)"
          placeholder="Rechercher une marque…"
          class="form-input w-full max-w-md"
        />
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          @for (i of skeletons; track i) {
            <div class="card p-4 animate-pulse">
              <div class="w-full aspect-square rounded-xl skeleton mb-3"></div>
              <div class="h-4 rounded skeleton w-3/4 mx-auto mb-2"></div>
              <div class="h-3 rounded skeleton w-1/2 mx-auto"></div>
            </div>
          }
        </div>
      }

      <!-- Grid -->
      @if (!loading()) {
        @if (filtered().length) {
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            @for (m of filtered(); track m.id) {
              <div class="card overflow-hidden group flex flex-col">
                <!-- Image -->
                <div class="aspect-square flex items-center justify-center overflow-hidden"
                  style="background: var(--bg-secondary)">
                  @if (m.image) {
                    <img [src]="m.image" [alt]="m.name"
                      class="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105" />
                  } @else {
                    <span class="text-5xl opacity-30">🏷️</span>
                  }
                </div>

                <!-- Info -->
                <div class="p-4 flex flex-col flex-1">
                  <h3 class="font-bold text-sm truncate mb-1" style="color: var(--text-primary)">{{ m.name }}</h3>
                  @if (m.description) {
                    <p class="text-xs line-clamp-2 flex-1" style="color: var(--text-secondary)">{{ m.description }}</p>
                  }
                  <div class="flex gap-2 mt-3">
                    <a [routerLink]="['/admin/marques', m.id, 'edit']"
                      class="btn-secondary flex-1 text-xs py-1.5 text-center">
                      ✏️ Modifier
                    </a>
                    <button (click)="delete(m)"
                      class="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style="background:#fee2e2;color:#dc2626">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="card py-16 text-center">
            <div class="text-5xl mb-4">🏷️</div>
            <p class="font-semibold" style="color: var(--text-primary)">Aucune marque trouvée</p>
            <p class="text-sm mt-1 mb-5" style="color: var(--text-secondary)">
              {{ search() ? 'Aucun résultat pour "' + search() + '"' : 'Commencez par créer une marque.' }}
            </p>
            @if (!search()) {
              <a routerLink="/admin/marques/new" class="btn-primary">+ Nouvelle marque</a>
            }
          </div>
        }
      }
    </div>
  `,
})
export class AdminMarqueListComponent {
  private marqueSvc = inject(MarqueService);

  protected marques  = signal<Marque[]>([]);
  protected loading  = signal(true);
  protected search   = signal('');
  protected skeletons = Array(10).fill(0);

  protected filtered = computed(() => {
    const q = this.search().toLowerCase();
    return q
      ? this.marques().filter(m =>
          m.name.toLowerCase().includes(q) ||
          (m.description ?? '').toLowerCase().includes(q)
        )
      : this.marques();
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.marqueSvc.getAll().subscribe({
      next: list => { this.marques.set(list); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  async delete(m: Marque): Promise<void> {
    const result = await Swal.fire({
      title: 'Supprimer cette marque ?',
      html: `<span style="color:#6b7280">Vous allez supprimer <strong>${m.name}</strong>. Cette action est irréversible.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    await this.marqueSvc.delete(m.id!);
    this.marques.update(list => list.filter(x => x.id !== m.id));
  }
}
