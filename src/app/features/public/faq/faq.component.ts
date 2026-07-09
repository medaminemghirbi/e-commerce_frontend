import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FaqService } from '../../../core/services/faq.service';
import { Faq } from '../../../core/models/faq.model';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen" style="background: var(--bg)">

      <!-- Hero -->
      <div class="relative overflow-hidden py-16 px-4" style="background: linear-gradient(135deg, var(--primary) 0%, #004d00 100%)">
        <div class="absolute inset-0 opacity-10"
          style="background-image: radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px); background-size: 40px 40px">
        </div>
        <div class="relative max-w-2xl mx-auto text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 text-3xl"
            style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px)">❓</div>
          <h1 class="text-4xl font-extrabold text-white mb-3">Questions fréquentes</h1>
          <p class="text-lg mb-8" style="color: rgba(255,255,255,0.8)">Trouvez rapidement les réponses à vos questions.</p>

          <!-- Search -->
          <div class="relative max-w-md mx-auto">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            <input
              type="text"
              [(ngModel)]="search"
              placeholder="Rechercher une question..."
              class="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none border-0"
              style="background: rgba(255,255,255,0.95); color: var(--text-primary); box-shadow: 0 8px 32px rgba(0,0,0,0.2)"
            />
          </div>
        </div>
      </div>

      <div class="max-w-3xl mx-auto px-4 py-12">

        <!-- Category tabs -->
        @if (!search) {
          <div class="flex gap-2 flex-wrap mb-8 justify-center">
            <button
              (click)="activeCategory.set('all')"
              class="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              [style.background]="activeCategory() === 'all' ? 'var(--primary)' : 'var(--bg-card)'"
              [style.color]="activeCategory() === 'all' ? 'white' : 'var(--text-secondary)'"
              [style.box-shadow]="activeCategory() === 'all' ? '0 4px 14px rgba(0,100,0,0.3)' : 'none'"
              style="border: 1px solid var(--border)"
            >Toutes</button>
            @for (cat of categories(); track cat) {
              <button
                (click)="activeCategory.set(cat)"
                class="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
                [style.background]="activeCategory() === cat ? 'var(--primary)' : 'var(--bg-card)'"
                [style.color]="activeCategory() === cat ? 'white' : 'var(--text-secondary)'"
                [style.box-shadow]="activeCategory() === cat ? '0 4px 14px rgba(0,100,0,0.3)' : 'none'"
                style="border: 1px solid var(--border)"
              >
                {{ categoryEmoji(cat) }} {{ cat }}
                <span class="ml-1.5 text-xs opacity-70">({{ grouped()[cat]?.length }})</span>
              </button>
            }
          </div>
        }

        <!-- Loading -->
        @if (loading()) {
          <div class="space-y-3">
            @for (item of [1,2,3,4]; track item) {
              <div class="rounded-2xl h-16 animate-pulse" style="background: var(--bg-card)"></div>
            }
          </div>
        }

        <!-- No results -->
        @if (!loading() && visibleFaqs().length === 0) {
          <div class="text-center py-16">
            <div class="text-5xl mb-4">🤔</div>
            <p class="text-lg font-semibold mb-2" style="color: var(--text-primary)">Aucun résultat</p>
            <p style="color: var(--text-secondary)">Essayez un autre terme ou contactez-nous directement.</p>
          </div>
        }

        <!-- FAQ items -->
        @if (!loading()) {
          <div class="space-y-3">
            @for (faq of visibleFaqs(); track faq.id) {
              <div
                class="rounded-2xl overflow-hidden transition-all duration-200"
                style="background: var(--bg-card); border: 1px solid var(--border)"
                [style.box-shadow]="openId() === faq.id ? '0 8px 24px rgba(0,100,0,0.12)' : '0 1px 4px rgba(0,0,0,0.04)'"
                [style.border-color]="openId() === faq.id ? 'var(--primary)' : 'var(--border)'"
              >
                <button
                  class="w-full flex items-center gap-4 p-5 text-left transition-all"
                  (click)="toggle(faq.id)"
                >
                  <!-- Icon bubble -->
                  <div
                    class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base transition-all"
                    [style.background]="openId() === faq.id ? 'var(--primary)' : 'var(--primary-light)'"
                    [style.color]="openId() === faq.id ? 'white' : 'var(--primary)'"
                  >{{ categoryEmoji(faq.category) }}</div>

                  <span class="flex-1 font-semibold text-sm sm:text-base" style="color: var(--text-primary)">
                    {{ faq.question }}
                  </span>

                  <!-- Chevron -->
                  <div
                    class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
                    [style.background]="openId() === faq.id ? 'var(--primary)' : 'var(--primary-light)'"
                    [style.transform]="openId() === faq.id ? 'rotate(180deg)' : 'rotate(0)'"
                  >
                    <svg [style.color]="openId() === faq.id ? 'white' : 'var(--primary)'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </button>

                @if (openId() === faq.id) {
                  <div class="px-5 pb-5">
                    <div class="pl-13 ml-13" style="padding-left: 3.25rem">
                      <p class="text-sm sm:text-base leading-relaxed" style="color: var(--text-secondary)">{{ faq.answer }}</p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- CTA -->
        @if (!loading()) {
          <div class="mt-12 rounded-2xl p-8 text-center" style="background: var(--primary-light); border: 1px dashed var(--primary)">
            <div class="text-3xl mb-3">💬</div>
            <h3 class="text-lg font-bold mb-2" style="color: var(--text-primary)">Vous n'avez pas trouvé la réponse ?</h3>
            <p class="text-sm mb-5" style="color: var(--text-secondary)">Notre équipe est disponible pour vous aider du dimanche au jeudi.</p>
            <a routerLink="/contact"
              class="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style="background: var(--primary); box-shadow: 0 4px 14px rgba(0,100,0,0.3)"
            >📧 Nous contacter</a>
          </div>
        }

      </div>
    </div>
  `,
})
export class FaqComponent implements OnInit {
  private faqSvc = inject(FaqService);

  protected loading      = signal(true);
  protected grouped      = signal<Record<string, Faq[]>>({});
  protected categories   = signal<string[]>([]);
  protected openId       = signal<number | null>(null);
  protected activeCategory = signal('all');
  protected search = '';

  protected visibleFaqs = computed(() => {
    const q = this.search.trim().toLowerCase();
    if (q) {
      const all = Object.values(this.grouped()).flat();
      return all.filter(f =>
        f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
      );
    }
    if (this.activeCategory() === 'all') return Object.values(this.grouped()).flat();
    return this.grouped()[this.activeCategory()] ?? [];
  });

  ngOnInit(): void {
    this.faqSvc.getGrouped().subscribe({
      next: data => {
        this.grouped.set(data);
        this.categories.set(Object.keys(data));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected toggle(id: number): void {
    this.openId.set(this.openId() === id ? null : id);
  }

  protected categoryEmoji(cat: string): string {
    const map: Record<string, string> = {
      'Livraison': '🚚', 'Paiement': '💳', 'Produits': '💊',
      'Retours': '↩️', 'Compte': '👤', 'Général': '💬',
    };
    return map[cat] ?? '❓';
  }
}
