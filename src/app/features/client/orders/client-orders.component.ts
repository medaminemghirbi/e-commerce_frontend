import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { ReviewService } from '../../../core/services/review.service';
import { Order } from '../../../core/models/order.model';
import { switchMap, of } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

const STATUS_CLASSES: Record<string, string> = {
  pending:   'badge-warning',
  confirmed: 'badge-primary',
  shipped:   'badge-primary',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

@Component({
  selector: 'app-client-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-10">
      <h1 class="text-3xl font-extrabold mb-8" style="color:var(--text-primary)">
        📋 {{ 'ORDERS.TITLE' | translate }}
      </h1>

      @if (!auth.isLoggedIn()) {
        <div class="card p-16 text-center">
          <p class="mb-4" style="color:var(--text-secondary)">{{ 'ORDERS.LOGIN_REQUIRED' | translate }}</p>
          <a routerLink="/auth/login" class="btn-primary">{{ 'NAV.LOGIN' | translate }}</a>
        </div>
      } @else if (!orders() || orders()!.length === 0) {
        <div class="card p-16 text-center">
          <div class="text-6xl mb-4">📭</div>
          <p class="mb-6" style="color:var(--text-secondary)">{{ 'ORDERS.EMPTY' | translate }}</p>
          <a routerLink="/products" class="btn-primary">{{ 'CART.BROWSE' | translate }}</a>
        </div>
      } @else {
        <div class="space-y-5">
          @for (order of orders()!; track order.id) {
            <div class="card p-5">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-xs font-mono mb-1" style="color:var(--text-secondary)">{{ 'ORDERS.ORDER_ID' | translate }}: {{ order.id }}</p>
                  <p class="text-sm" style="color:var(--text-secondary)">{{ order.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span [class]="'badge ' + getStatusClass(order.status)">
                    {{ 'ORDERS.STATUS.' + order.status.toUpperCase() | translate }}
                  </span>
                  <!-- Review button -->
                  @if (canReview(order)) {
                    @if (hasReviewed(order.id)) {
                      <div class="flex items-center gap-1 text-sm font-medium" style="color:var(--primary)">
                        <span>⭐</span>
                        <span>Avis déposé</span>
                      </div>
                    } @else {
                      <button
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style="background:var(--primary-light); color:var(--primary); border:1px solid var(--primary)"
                        (click)="openReview(order)"
                      >⭐ Laisser un avis</button>
                    }
                  }
                </div>
              </div>

              <!-- Items -->
              <div class="space-y-2 mb-4">
                @for (item of order.items; track item.productId) {
                  <div class="flex items-center gap-3 text-sm">
                    <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0" style="border:1px solid var(--border)">
                      @if (item.image) { <img [src]="item.image" class="w-full h-full object-cover" /> }
                    </div>
                    @if (item.productId) {
                      <button (click)="goToProduct(item.productId)"
                        class="flex-1 text-left hover:underline transition-colors"
                        style="color:var(--text-primary)">{{ getName(item) }}</button>
                    } @else {
                      <span class="flex-1" style="color:var(--text-primary)">{{ getName(item) }}</span>
                    }
                    <span style="color:var(--text-secondary)">x{{ item.quantity }}</span>
                    <span class="font-bold" style="color:var(--primary)">{{ item.subtotal | number:'1.2-2' }} TND</span>
                  </div>
                }
              </div>

              <!-- Totals -->
              <div class="border-t pt-3 text-sm space-y-1" style="border-color:var(--border)">
                <div class="flex justify-between">
                  <span style="color:var(--text-secondary)">{{ 'CART.DELIVERY' | translate }}</span>
                  <span>{{ order.delivery_fee }} TND</span>
                </div>
                <div class="flex justify-between font-bold">
                  <span style="color:var(--text-primary)">{{ 'CART.TOTAL' | translate }}</span>
                  <span style="color:var(--primary)">{{ order.total | number:'1.2-2' }} TND</span>
                </div>
                <p class="text-xs pt-1" style="color:var(--text-secondary)">
                  📍 {{ order.delivery_address.full_name }} — {{ order.delivery_address.address }}, {{ order.delivery_address.city }}, {{ order.delivery_address.wilaya }}
                </p>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Review Modal -->
    @if (reviewOrder()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.55)">
        <div class="card w-full max-w-md p-7 space-y-5">
          <div class="text-center">
            <div class="text-4xl mb-2">⭐</div>
            <h2 class="text-xl font-bold" style="color:var(--text-primary)">Votre avis</h2>
            <p class="text-sm mt-1" style="color:var(--text-secondary)">Commande #{{ reviewOrder()!.id }}</p>
          </div>

          <!-- Stars -->
          <div class="flex justify-center gap-2">
            @for (star of [1,2,3,4,5]; track star) {
              <button
                (click)="reviewRating.set(star)"
                (mouseenter)="hoverRating.set(star)"
                (mouseleave)="hoverRating.set(0)"
                class="text-4xl transition-transform hover:scale-110"
                [style.color]="(hoverRating() || reviewRating()) >= star ? '#f59e0b' : 'var(--border)'"
              >★</button>
            }
          </div>
          <p class="text-center text-sm font-medium" style="color:var(--text-secondary)">
            {{ ratingLabel() }}
          </p>

          <!-- Comment -->
          <div class="form-field">
            <label class="form-label">Commentaire (optionnel)</label>
            <textarea
              [(ngModel)]="reviewComment"
              rows="3"
              class="form-input resize-none"
              placeholder="Partagez votre expérience..."
            ></textarea>
          </div>

          @if (reviewError()) {
            <p class="text-sm text-red-500 text-center">{{ reviewError() }}</p>
          }

          <div class="flex gap-3">
            <button
              class="btn-primary flex-1"
              (click)="submitReview()"
              [disabled]="reviewRating() === 0 || reviewSubmitting()"
              [class.opacity-60]="reviewRating() === 0 || reviewSubmitting()"
            >
              {{ reviewSubmitting() ? 'Envoi...' : 'Envoyer mon avis' }}
            </button>
            <button class="btn-secondary flex-1" (click)="closeReview()">Annuler</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ClientOrdersComponent implements OnInit {
  protected auth       = inject(AuthService);
  private orderSvc     = inject(OrderService);
  private reviewSvc    = inject(ReviewService);
  private lang         = inject(LanguageService);
  private router       = inject(Router);

  protected reviewedOrderIds = signal<Set<number | string>>(new Set());
  protected reviewOrder      = signal<Order | null>(null);
  protected reviewRating     = signal(0);
  protected hoverRating      = signal(0);
  protected reviewComment    = '';
  protected reviewSubmitting = signal(false);
  protected reviewError      = signal('');

  protected orders = toSignal(
    toObservable(this.auth.currentUser).pipe(
      switchMap(user => user ? this.orderSvc.getByUser(user.id) : of([]))
    ),
    { initialValue: [] as Order[] }
  );

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.reviewSvc.getMyReviews().subscribe(reviews => {
        this.reviewedOrderIds.set(new Set(reviews.map(r => r.order_id)));
      });
    }
  }

  canReview(order: Order): boolean {
    return ['confirmed', 'shipped', 'delivered'].includes(order.status);
  }

  hasReviewed(orderId: number | string | undefined): boolean {
    return orderId !== undefined && this.reviewedOrderIds().has(orderId);
  }

  openReview(order: Order): void {
    this.reviewOrder.set(order);
    this.reviewRating.set(0);
    this.hoverRating.set(0);
    this.reviewComment = '';
    this.reviewError.set('');
  }

  closeReview(): void {
    this.reviewOrder.set(null);
  }

  ratingLabel(): string {
    const r = this.hoverRating() || this.reviewRating();
    return ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent !'][r] ?? '';
  }

  submitReview(): void {
    if (this.reviewRating() === 0) return;
    this.reviewSubmitting.set(true);
    this.reviewError.set('');
    this.reviewSvc.create({
      order_id: this.reviewOrder()!.id!,
      rating:   this.reviewRating(),
      comment:  this.reviewComment,
    }).subscribe({
      next: () => {
        const ids = new Set(this.reviewedOrderIds());
        ids.add(this.reviewOrder()!.id!);
        this.reviewedOrderIds.set(ids);
        this.reviewSubmitting.set(false);
        this.closeReview();
      },
      error: (e) => {
        this.reviewSubmitting.set(false);
        this.reviewError.set(e.error?.error ?? 'Une erreur est survenue.');
      },
    });
  }

  goToProduct(productId: number | string): void {
    this.router.navigate(['/products', productId]);
  }

  getStatusClass(status: string): string {
    return STATUS_CLASSES[status] ?? 'badge-primary';
  }

  getName(item: any): string {
    const l = this.lang.lang();
    return item[`name_${l}`] ?? item.name_fr ?? item.name_en;
  }
}
