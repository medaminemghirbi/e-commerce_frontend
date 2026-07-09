import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AstuceService } from '../../../core/services/astuce.service';
import { Astuce } from '../../../core/models/astuce.model';

const CATEGORIES = ['Toutes', 'Général', 'Nutrition', 'Sport & Rééducation', 'Soins', 'Diabète', 'Cardiologie'];

@Component({
  selector: 'app-astuces-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">

      <!-- Hero -->
      <div class="relative py-16 px-4 text-center overflow-hidden"
        style="background:linear-gradient(135deg,var(--primary) 0%,#004d00 100%)">
        <div class="absolute inset-0 opacity-10"
          style="background-image:radial-gradient(circle at 25% 50%,white 1px,transparent 1px),radial-gradient(circle at 75% 25%,white 1px,transparent 1px);background-size:40px 40px"></div>
        <div class="relative max-w-2xl mx-auto">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 text-3xl"
            style="background:rgba(255,255,255,0.15)">💡</div>
          <h1 class="text-4xl font-extrabold text-white mb-3">Astuces & Conseils</h1>
          <p style="color:rgba(255,255,255,0.8)" class="text-lg mb-8">Des conseils santé par nos experts pour votre bien-être.</p>
          <div class="relative max-w-md mx-auto">
            <span class="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
            <input [(ngModel)]="search" type="text" placeholder="Rechercher une astuce..."
              class="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm outline-none border-0"
              style="background:rgba(255,255,255,0.95);color:var(--text-primary);box-shadow:0 8px 32px rgba(0,0,0,0.2)" />
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 py-10">

        <!-- Category tabs -->
        <div class="flex gap-2 flex-wrap mb-8">
          @for (cat of categories; track cat) {
            <button (click)="activeCategory.set(cat)"
              class="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              [style.background]="activeCategory() === cat ? 'var(--primary)' : 'var(--bg-card)'"
              [style.color]="activeCategory() === cat ? 'white' : 'var(--text-secondary)'"
              style="border:1px solid var(--border)">
              {{ cat }}
            </button>
          }
        </div>

        <!-- Loading skeleton -->
        @if (loading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="card animate-pulse" style="height:280px"></div>
            }
          </div>
        }

        <!-- Empty -->
        @if (!loading() && visible().length === 0) {
          <div class="text-center py-20">
            <div class="text-5xl mb-4">🤷</div>
            <p class="text-lg font-semibold" style="color:var(--text-primary)">Aucune astuce trouvée</p>
          </div>
        }

        <!-- Grid -->
        @if (!loading()) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (a of visible(); track a.id) {
              <a [routerLink]="['/astuces', a.id]"
                class="card overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-200"
                style="text-decoration:none; box-shadow:0 2px 8px rgba(0,0,0,0.06)"
              >
                <!-- Image -->
                <div class="relative overflow-hidden" style="height:200px;background:var(--bg-secondary)">
                  @if (a.images.length) {
                    <img [src]="a.images[0]" [alt]="a.title"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-6xl opacity-20">💡</div>
                  }
                  <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
                    style="background:var(--primary);color:white">{{ a.category }}</span>
                </div>

                <!-- Content -->
                <div class="p-5 flex flex-col flex-1">
                  <h3 class="font-bold text-base mb-2 line-clamp-2" style="color:var(--text-primary)">{{ a.title }}</h3>
                  @if (a.description) {
                    <p class="text-sm leading-relaxed line-clamp-3 flex-1" style="color:var(--text-secondary)">{{ a.description }}</p>
                  }
                  <div class="flex items-center gap-2 mt-4 text-sm font-semibold" style="color:var(--primary)">
                    Lire la suite
                    <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                    </svg>
                  </div>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class AstucesListComponent implements OnInit {
  private astuceSvc = inject(AstuceService);

  protected loading        = signal(true);
  protected astuces        = signal<Astuce[]>([]);
  protected activeCategory = signal('Toutes');
  protected search         = '';
  protected categories     = CATEGORIES;

  protected visible = () => {
    const q   = this.search.trim().toLowerCase();
    const cat = this.activeCategory();
    return this.astuces().filter(a =>
      (cat === 'Toutes' || a.category === cat) &&
      (!q || a.title.toLowerCase().includes(q) || (a.description ?? '').toLowerCase().includes(q))
    );
  };

  ngOnInit(): void {
    this.astuceSvc.getAll().subscribe({
      next: data => { this.astuces.set(data); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }
}
