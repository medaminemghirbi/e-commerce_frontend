import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductService }  from '../../../core/services/product.service';
import { SliderService }   from '../../../core/services/slider.service';
import { ReviewService }   from '../../../core/services/review.service';
import { AstuceService }   from '../../../core/services/astuce.service';
import { SliderImage }     from '../../../core/models/slider.model';
import { Review }          from '../../../core/models/review.model';
import { Astuce }          from '../../../core/models/astuce.model';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SeoService }      from '../../../core/services/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe, ProductCardComponent],
  styles: [`
    /* ─── Slider ─── */
    .slide { position:absolute; inset:0; transition:opacity 0.9s cubic-bezier(.4,0,.2,1); }
    .slide.active  { opacity:1; z-index:1; }
    .slide.inactive{ opacity:0; z-index:0; }

    .slide-img { transition: transform 6s ease; }
    .slide.active .slide-img { transform: scale(1.04); }
    .slide.inactive .slide-img { transform: scale(1); }

    .dot { width:8px; height:8px; border-radius:50%; transition:all .35s cubic-bezier(.4,0,.2,1); cursor:pointer; flex-shrink:0; }
    .dot.active { width:28px; border-radius:4px; }

    @keyframes progress { from { width:0 } to { width:100% } }
    .progress-anim { animation: progress 5s linear forwards; }

    .arrow-btn {
      width:44px; height:44px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      background:var(--bg-card); color:var(--primary);
      border:1.5px solid var(--border); box-shadow:var(--shadow-md);
      transition:all .22s; cursor:pointer;
    }
    .arrow-btn:hover { background:var(--primary); color:#fff; border-color:var(--primary); transform:scale(1.08); }

    /* ─── Step number ─── */
    .step-num {
      width:40px; height:40px; border-radius:50%; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:.875rem; font-weight:800; color:white;
      background:linear-gradient(135deg,var(--primary),var(--accent));
    }

    /* ─── Section pill badge ─── */
    .pill {
      display:inline-flex; align-items:center; gap:6px;
      padding:4px 14px; border-radius:99px; font-size:13px; font-weight:600;
      background:var(--primary-light); color:var(--primary);
    }

    /* ─── Scroll reveal (CSS only) ─── */
    .reveal { opacity:0; transform:translateY(20px); transition:opacity .6s ease, transform .6s ease; }
    .reveal.visible { opacity:1; transform:translateY(0); }
  `],
  template: `

    <!-- ════════════════════════════════════════════════════════════
         HERO  —  Slider (dynamic) or Fallback vitrine
    ═════════════════════════════════════════════════════════════ -->

    <!-- SKELETON while loading — contained banner -->
    @if (!sliderLoaded()) {
      <div class="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 pt-5 sm:pt-6">
        <div class="skeleton rounded-2xl sm:rounded-3xl aspect-[16/9] sm:aspect-[21/9] lg:aspect-[12/5]"
          style="background:linear-gradient(135deg,#041a0a 0%,#0a2e18 45%,#082410 100%)"></div>
      </div>
    }

    <!-- SLIDER — contained, rounded banner with external nav arrows -->
    @if (sliderLoaded() && slides().length > 0) {
      <div class="relative max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 pt-5 sm:pt-6"
        (mouseenter)="pauseTimer()" (mouseleave)="resumeTimer()">

        <section class="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl aspect-[16/9] sm:aspect-[21/9] lg:aspect-[12/5]">
          <!-- slides -->
          @for (slide of slides(); track slide.id; let i = $index) {
            <div class="slide" [class.active]="currentSlide()===i" [class.inactive]="currentSlide()!==i">
              <img [src]="sliderImgUrl(slide.image_url)" class="slide-img w-full h-full object-cover"
                [alt]="slide.title || 'MedicareInaya'"
                [attr.loading]="i === 0 ? 'eager' : 'lazy'"
                [attr.fetchpriority]="i === 0 ? 'high' : null"
                decoding="async" />
            </div>
          }

          @if (slides().length > 1) {
            <!-- progress bar -->
            <div class="absolute top-0 left-0 right-0 h-1" style="z-index:4;background:rgba(255,255,255,.25)">
              <div class="h-full" [class.progress-anim]="isRunning()" style="background:var(--primary)"></div>
            </div>

            <!-- dots -->
            <div class="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2" style="z-index:3">
              @for (s of slides(); track s.id; let i = $index) {
                <button (click)="goTo(i)" class="dot"
                  [class.active]="currentSlide()===i"
                  [style.background]="currentSlide()===i ? 'white' : 'rgba(255,255,255,.5)'">
                </button>
              }
            </div>
          }
        </section>

        @if (slides().length > 1) {
          <!-- arrows — straddle the gutter/card boundary, like the reference design -->
          <button (click)="prev()" class="arrow-btn absolute left-4 sm:left-8 lg:left-12 top-1/2 -translate-x-1/2 -translate-y-1/2" style="z-index:3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button (click)="next()" class="arrow-btn absolute right-4 sm:right-8 lg:right-12 top-1/2 translate-x-1/2 -translate-y-1/2" style="z-index:3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        }
      </div>
    }

    <!-- FALLBACK — no slides configured -->
    @if (sliderLoaded() && slides().length === 0) {
      <div class="max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 pt-5 sm:pt-6">
        <section class="relative flex items-center justify-center rounded-2xl sm:rounded-3xl aspect-[16/9] sm:aspect-[21/9] lg:aspect-[12/5]"
          style="background:linear-gradient(135deg,#041a0a 0%,#0a2e18 45%,#082410 100%)">
          <img src="assets/images/logo.png" alt="MedicareInaya" class="h-40 w-auto opacity-90" />
        </section>
      </div>
    }

    <!-- ════════════════════════════════════════════════════════════
         FEATURED PRODUCTS
    ═════════════════════════════════════════════════════════════ -->
    <section class="py-20 px-4 sm:px-6 lg:px-8" style="background:var(--bg-card)">
      <div class="max-w-7xl mx-auto">

        <div class="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <span class="pill mb-2">⭐ {{ 'HOME.FEATURED.TITLE' | translate }}</span>
            <h2 class="text-3xl font-extrabold" style="color:var(--text-primary)">
              {{ 'HOME.FEATURED.TITLE' | translate }}
            </h2>
            <p class="text-sm mt-1.5" style="color:var(--text-secondary)">{{ 'HOME.FEATURED.SUBTITLE' | translate }}</p>
          </div>
          <a routerLink="/products" class="btn-secondary shrink-0 inline-flex items-center gap-2 text-sm">
            {{ 'HOME.FEATURED.VIEW_ALL' | translate }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
        </div>

        @if (products()?.length) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            @for (p of products()?.slice(0,12); track p.id) {
              <app-product-card [product]="p" />
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            @for (i of [1,2,3,4]; track i) {
              <div class="card overflow-hidden">
                <div class="skeleton h-52 rounded-none"></div>
                <div class="p-4 space-y-2.5">
                  <div class="skeleton h-4 w-3/4 rounded-lg"></div>
                  <div class="skeleton h-3 w-full rounded-lg"></div>
                  <div class="skeleton h-3 w-1/2 rounded-lg"></div>
                  <div class="skeleton h-8 w-full rounded-xl mt-2"></div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════
         HOW IT WORKS  —  Delivery timeline
    ═════════════════════════════════════════════════════════════ -->
    <section class="py-20 px-4 sm:px-6 lg:px-8" style="background:var(--bg)">
      <div class="max-w-7xl mx-auto">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <!-- Left: image + floating chips -->
          <div class="relative flex justify-center order-last lg:order-first">
            <!-- glow -->
            <div class="absolute inset-0 rounded-3xl blur-3xl opacity-[.15]"
              style="background:linear-gradient(135deg,var(--primary),var(--accent))"></div>

            <div class="relative w-full max-w-md">
              <!-- floating chips -->
              <div class="absolute -top-5 -right-5 z-10 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl"
                style="background:linear-gradient(135deg,var(--primary),var(--accent));color:white">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span class="text-sm font-bold">Livraison 24–48h</span>
              </div>
              <div class="absolute -bottom-5 -left-5 z-10 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl"
                style="background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary)">
                <span class="text-lg">🇹🇳</span>
                <span class="text-sm font-semibold">Toute la Tunisie</span>
              </div>

              <img src="assets/images/livraison.png" alt="Livraison MedicareInaya"
                class="relative rounded-3xl shadow-2xl w-full object-cover"
                style="aspect-ratio:4/3;object-position:center" />
            </div>
          </div>

          <!-- Right: steps -->
          <div class="space-y-5">
            <span class="pill">🚚 Comment ça marche</span>
            <h2 class="text-3xl font-extrabold leading-tight" style="color:var(--text-primary)">
              Livraison partout<br/>
              <span style="color:var(--primary)">en Tunisie</span>
            </h2>
            <p class="text-base leading-relaxed" style="color:var(--text-secondary)">
              Commandez depuis chez vous et recevez vos produits médicaux directement à votre porte.
            </p>

            <div class="space-y-3 pt-2">
              @for (step of deliverySteps; track step.title; let i = $index; let last = $last) {
                <div class="relative flex items-start gap-4">
                  <!-- connector line -->
                  @if (!last) {
                    <div class="absolute left-5 top-12 w-0.5 h-[calc(100%+4px)]"
                      style="background:linear-gradient(to bottom,var(--primary),transparent)"></div>
                  }
                  <div class="step-num shrink-0">{{ i + 1 }}</div>
                  <div class="card flex-1 px-5 py-4" style="background:var(--bg-card)">
                    <h4 class="font-bold text-sm" style="color:var(--text-primary)">{{ step.title }}</h4>
                    <p class="text-xs mt-0.5 leading-relaxed" style="color:var(--text-secondary)">{{ step.desc }}</p>
                  </div>
                </div>
              }
            </div>

            <div class="pt-3">
              <a routerLink="/products" class="btn-primary inline-flex items-center gap-2">
                Commander maintenant
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════
         WHY CHOOSE US  —  3 feature cards
    ═════════════════════════════════════════════════════════════ -->
    <section class="py-20 px-4 sm:px-6 lg:px-8" style="background:var(--bg-secondary,var(--bg))">
      <div class="max-w-7xl mx-auto">

        <div class="text-center mb-12">
          <span class="pill mb-3">✨ {{ 'HOME.WHY.TITLE' | translate }}</span>
          <h2 class="text-3xl font-extrabold" style="color:var(--text-primary)">
            {{ 'HOME.WHY.TITLE' | translate }}
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (f of whyFeatures; track f.title) {
            <div class="card p-8 flex flex-col gap-5" style="transition:transform .25s,box-shadow .25s">
              <!-- icon ring -->
              <div class="relative w-fit">
                <div class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                  [style.background]="f.bg">{{ f.icon }}</div>
                <div class="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style="background:var(--primary)">
                  <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="font-bold text-lg mb-2" style="color:var(--text-primary)">{{ f.title | translate }}</h3>
                <p class="text-sm leading-relaxed" style="color:var(--text-secondary)">{{ f.desc | translate }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ════════════════════════════════════════════════════════════
         ASTUCES
    ═════════════════════════════════════════════════════════════ -->
    @if (astuces().length > 0) {
      <section class="py-20 px-4 sm:px-6 lg:px-8" style="background:var(--bg)">
        <div class="max-w-7xl mx-auto">
          <div class="flex items-end justify-between mb-10">
            <div>
              <span class="pill mb-3">💡 Conseils santé</span>
              <h2 class="text-3xl font-extrabold" style="color:var(--text-primary)">Nos astuces & conseils</h2>
            </div>
            <a routerLink="/astuces" class="btn-secondary hidden sm:flex items-center gap-2 text-sm">
              Voir tout
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </a>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (a of astuces(); track a.id) {
              <a [routerLink]="['/astuces', a.id]"
                class="card overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-200"
                style="text-decoration:none">
                <div class="relative overflow-hidden" style="height:180px;background:var(--bg-secondary)">
                  @if (a.images.length) {
                    <img [src]="a.images[0]" [alt]="a.title"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-5xl opacity-20">💡</div>
                  }
                  <span class="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
                    style="background:var(--primary);color:white">{{ a.category }}</span>
                </div>
                <div class="p-5 flex flex-col flex-1">
                  <h3 class="font-bold text-base mb-2 line-clamp-2" style="color:var(--text-primary)">{{ a.title }}</h3>
                  @if (a.description) {
                    <p class="text-sm leading-relaxed line-clamp-2 flex-1" style="color:var(--text-secondary)">{{ a.description }}</p>
                  }
                  <span class="mt-4 text-sm font-semibold flex items-center gap-1" style="color:var(--primary)">
                    Lire →
                  </span>
                </div>
              </a>
            }
          </div>

          <div class="text-center mt-8 sm:hidden">
            <a routerLink="/astuces" class="btn-secondary">Voir toutes les astuces</a>
          </div>
        </div>
      </section>
    }

    <!-- ════════════════════════════════════════════════════════════
         TESTIMONIALS / REVIEWS
    ═════════════════════════════════════════════════════════════ -->
    @if (reviews().length > 0) {
      <section class="py-20 px-4 sm:px-6 lg:px-8 overflow-hidden" style="background:var(--bg-card)">
        <div class="max-w-7xl mx-auto">

          <div class="text-center mb-12">
            <span class="pill mb-3">⭐ Avis clients</span>
            <h2 class="text-3xl font-extrabold mb-2" style="color:var(--text-primary)">Ce que disent nos clients</h2>
            <div class="flex items-center justify-center gap-2 mt-3">
              <div class="flex gap-0.5">
                @for (s of [1,2,3,4,5]; track s) {
                  <span class="text-xl" style="color:#f59e0b">★</span>
                }
              </div>
              <span class="text-sm font-semibold" style="color:var(--text-secondary)">
                {{ avgRating() }}/5 · {{ reviews().length }} avis vérifiés
              </span>
            </div>
          </div>

          <!-- Scrollable row -->
          <div class="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
            @for (r of reviews(); track r.id) {
              <div
                class="card p-6 flex flex-col gap-4 snap-start shrink-0"
                style="width:300px; min-height:180px"
              >
                <!-- Stars -->
                <div class="flex gap-0.5">
                  @for (s of [1,2,3,4,5]; track s) {
                    <span [style.color]="s <= r.rating ? '#f59e0b' : 'var(--border)'">★</span>
                  }
                </div>

                <!-- Comment -->
                <p class="text-sm leading-relaxed flex-1" style="color:var(--text-secondary)">
                  "{{ r.comment || 'Très satisfait de ma commande !' }}"
                </p>

                <!-- Author -->
                <div class="flex items-center gap-3 border-t pt-3" style="border-color:var(--border)">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style="background:linear-gradient(135deg,var(--primary),var(--accent))"
                  >{{ r.first_name?.[0]?.toUpperCase() || '?' }}</div>
                  <div>
                    <div class="text-sm font-semibold" style="color:var(--text-primary)">{{ r.first_name }}</div>
                    <div class="text-xs" style="color:var(--text-secondary)">{{ r.created_at | date:'MMM yyyy' }}</div>
                  </div>
                  <div class="ml-auto">
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium" style="background:var(--primary-light);color:var(--primary)">✓ Achat vérifié</span>
                  </div>
                </div>
              </div>
            }
          </div>

        </div>
      </section>
    }

    <!-- ════════════════════════════════════════════════════════════
         CTA  BANNER
    ═════════════════════════════════════════════════════════════ -->
    <section class="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8"
      style="background:linear-gradient(135deg,var(--primary) 0%,var(--accent) 100%)">
      <!-- decorative circles -->
      <div class="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none opacity-20"
        style="background:rgba(255,255,255,.5)"></div>
      <div class="absolute -bottom-12 -left-12 w-52 h-52 rounded-full pointer-events-none opacity-15"
        style="background:rgba(255,255,255,.5)"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[.07]"
        style="background:white"></div>

      <div class="relative max-w-3xl mx-auto text-center">
        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
          style="background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.3)">
          💬 Contactez-nous
        </span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white mb-4">{{ 'HOME.CTA.TITLE' | translate }}</h2>
        <p class="text-base sm:text-lg mb-10" style="color:rgba(255,255,255,.82)">{{ 'HOME.CTA.SUBTITLE' | translate }}</p>

        <div class="flex flex-wrap justify-center gap-4">
          <a routerLink="/contact"
            class="inline-flex items-center gap-2 px-8 py-3.5 bg-white rounded-xl font-bold text-base transition-all hover:-translate-y-1 hover:shadow-2xl"
            style="color:var(--primary)">
            {{ 'HOME.CTA.BUTTON' | translate }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
            </svg>
          </a>
          <a routerLink="/products"
            class="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:-translate-y-1"
            style="background:rgba(255,255,255,.15);color:white;border:1.5px solid rgba(255,255,255,.35)">
            Voir nos produits
          </a>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit, OnDestroy {
  private productSvc  = inject(ProductService);
  private sliderSvc   = inject(SliderService);
  private reviewSvc   = inject(ReviewService);
  private astuceSvc   = inject(AstuceService);
  private seo         = inject(SeoService);

  protected products   = toSignal(this.productSvc.getFeatured());
  protected reviews    = signal<Review[]>([]);
  protected avgRating  = signal('5.0');
  protected astuces    = signal<Astuce[]>([]);

  protected slides       = signal<SliderImage[]>([]);
  protected currentSlide = signal(0);
  protected sliderLoaded = signal(false);
  protected isRunning    = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private paused = false;

  // ── Static data ───────────────────────────────────────────────

  protected whyFeatures = [
    { icon: '⚡', bg: 'linear-gradient(135deg,#ecfccb,#d9f99d)', title: 'HOME.WHY.FAST_TITLE',      desc: 'HOME.WHY.FAST_DESC' },
    { icon: '🛡️', bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', title: 'HOME.WHY.SECURE_TITLE',    desc: 'HOME.WHY.SECURE_DESC' },
    { icon: '🌐', bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', title: 'HOME.WHY.MULTILANG_TITLE', desc: 'HOME.WHY.MULTILANG_DESC' },
  ];

  protected deliverySteps = [
    { title: 'Passez votre commande en ligne',     desc: 'Sélectionnez vos produits et validez votre panier en quelques clics.' },
    { title: 'Préparation & expédition rapide',    desc: 'Votre colis est préparé et expédié le jour même ou le lendemain.' },
    { title: 'Livraison 24–48h partout en Tunisie',desc: 'Service disponible dans tous les gouvernorats.' },
    { title: 'Paiement à la livraison',            desc: 'Payez en espèces à la réception — aucun risque, satisfaction garantie.' },
  ];

  // ── Lifecycle ────────────────────────────────────────────────

  ngOnInit(): void {
    this.seo.set({
      title: 'Accueil',
      description: 'MedicareInaya — Votre plateforme de produits paramédicaux en Tunisie. Médicaments, soins, matériel médical livrés rapidement.',
      url: 'https://medicareinaya.com',
    });
    this.astuceSvc.getAll().subscribe(list => this.astuces.set(list.slice(0, 3)));
    this.reviewSvc.getPublished().subscribe(list => {
      this.reviews.set(list);
      if (list.length > 0) {
        const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
        this.avgRating.set(avg.toFixed(1));
      }
    });
    this.sliderSvc.getActive().subscribe(list => {
      this.slides.set(list);
      this.sliderLoaded.set(true);
      if (list.length > 1) this.startTimer();
    });
  }

  ngOnDestroy(): void { this.clearTimer(); }

  // ── Slider controls ──────────────────────────────────────────

  private startTimer(): void {
    this.isRunning.set(true);
    this.timer = setInterval(() => {
      if (!this.paused) this.currentSlide.update(i => (i + 1) % this.slides().length);
    }, 5000);
  }

  private clearTimer(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.isRunning.set(false);
  }

  private resetTimer(): void { this.clearTimer(); if (this.slides().length > 1) this.startTimer(); }

  pauseTimer():  void { this.paused = true; }
  resumeTimer(): void { this.paused = false; }

  next():          void { this.currentSlide.update(i => (i + 1) % this.slides().length); this.resetTimer(); }
  prev():          void { this.currentSlide.update(i => (i - 1 + this.slides().length) % this.slides().length); this.resetTimer(); }
  goTo(i: number): void { this.currentSlide.set(i); this.resetTimer(); }

  // ── Helpers ──────────────────────────────────────────────────

  /** Requests a resized/optimized render from Supabase's image transform API
   *  instead of serving the raw upload at full viewport size. */
  protected sliderImgUrl(url: string): string {
    if (!url?.includes('/storage/v1/object/public/')) return url;
    return `${url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')}?width=1920&quality=80`;
  }
}
