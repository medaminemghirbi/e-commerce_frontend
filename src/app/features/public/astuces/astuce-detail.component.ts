import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AstuceService } from '../../../core/services/astuce.service';
import { Astuce } from '../../../core/models/astuce.model';

@Component({
  selector: 'app-astuce-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-10">

      <a routerLink="/astuces" class="inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors hover:opacity-80" style="color:var(--primary)">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Retour aux astuces
      </a>

      @if (loading()) {
        <div class="card animate-pulse" style="height:400px"></div>
      } @else if (astuce()) {
        <!-- Category badge -->
        <span class="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4"
          style="background:var(--primary-light);color:var(--primary)">
          💡 {{ astuce()!.category }}
        </span>

        <h1 class="text-3xl font-extrabold mb-6" style="color:var(--text-primary)">{{ astuce()!.title }}</h1>

        <!-- Images gallery -->
        @if (astuce()!.images.length) {
          <div class="grid gap-4 mb-8"
            [class.grid-cols-1]="astuce()!.images.length === 1"
            [class.grid-cols-2]="astuce()!.images.length > 1">
            @for (img of astuce()!.images; track img) {
              <div class="rounded-2xl overflow-hidden" style="max-height:360px">
                <img [src]="img" [alt]="astuce()!.title" class="w-full h-full object-cover cursor-pointer"
                  (click)="lightboxImg.set(img)" />
              </div>
            }
          </div>
        }

        <!-- Description -->
        @if (astuce()!.description) {
          <div class="card p-7">
            <p class="text-base leading-relaxed whitespace-pre-line" style="color:var(--text-secondary)">{{ astuce()!.description }}</p>
          </div>
        }

        <!-- Linked product -->
        @if (astuce()!.product_id) {
          <div class="mt-8 p-5 rounded-2xl flex items-center gap-4" style="background:var(--primary-light);border:1px solid var(--primary)">
            <span class="text-3xl">💊</span>
            <div class="flex-1">
              <p class="text-sm font-bold" style="color:var(--text-primary)">Produit associé</p>
              <p class="text-sm" style="color:var(--text-secondary)">Cette astuce est liée à un de nos produits.</p>
            </div>
            <a [routerLink]="['/products', astuce()!.product_id]" class="btn-primary text-sm">Voir le produit</a>
          </div>
        }
      }
    </div>

    <!-- Lightbox -->
    @if (lightboxImg()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style="background:rgba(0,0,0,0.85)"
        (click)="lightboxImg.set(null)">
        <img [src]="lightboxImg()!" class="max-w-full max-h-[90vh] rounded-2xl object-contain" />
      </div>
    }
  `,
})
export class AstuceDetailComponent implements OnInit {
  private astuceSvc = inject(AstuceService);
  private route     = inject(ActivatedRoute);

  protected loading     = signal(true);
  protected astuce      = signal<Astuce | null>(null);
  protected lightboxImg = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.astuceSvc.getById(id).subscribe({
      next: a  => { this.astuce.set(a); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
