import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProgressService } from '../../../core/services/progress.service';
import { Order, OrderStatus } from '../../../core/models/order.model';

const STATUS_CLASSES: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-primary',
  shipped: 'badge-primary',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  shipped: '🚚',
  delivered: '📦',
  cancelled: '❌',
};

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

type SortField = 'created_at' | 'total' | 'status';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslatePipe],
  styles: [
    `
      :host ::ng-deep .selected-row {
        background: var(--primary-light) !important;
      }
      th {
        white-space: nowrap;
      }
      .drawer-enter {
        transform: translateX(0) !important;
      }
    `,
  ],
  template: `
    <!-- ══ DRAWER BACKDROP ════════════════════════════════════ -->
    @if (drawerOpen()) {
      <div
        class="fixed inset-0 z-40"
        style="background:rgba(0,0,0,0.4)"
        (click)="closeDrawer()"
      ></div>
    }

    <!-- ══ DRAWER PANEL ════════════════════════════════════════ -->
    <div
      class="fixed top-0 right-0 bottom-0 z-50 w-full flex flex-col transition-transform duration-300 ease-in-out"
      style="max-width:440px;background:var(--bg-card);border-left:1px solid var(--border);box-shadow:-8px 0 40px rgba(0,0,0,0.15)"
      [style.transform]="drawerOpen() ? 'translateX(0)' : 'translateX(100%)'"
    >
      @if (activeOrder()) {
        <!-- Drawer header -->
        <div
          class="shrink-0 px-6 py-5 flex items-start justify-between"
          style="border-bottom:2px solid var(--border)"
        >
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span
                class="font-mono text-sm font-bold px-2 py-0.5 rounded-lg"
                style="background:var(--bg-secondary);color:var(--text-primary)"
              >
                #{{ shortId(activeOrder()!.id!) }}
              </span>
              <span [class]="'badge ' + getStatusClass(activeOrder()!.status)">
                {{ statusIcon(activeOrder()!.status) }} {{ statusLabel(activeOrder()!.status) }}
              </span>
            </div>
            <p class="font-bold text-base mt-1" style="color:var(--text-primary)">
              {{ activeOrder()!.delivery_address.full_name }}
            </p>
            <p class="text-sm" style="color:var(--text-secondary)">
              {{ activeOrder()!.user_email }} ·
              {{ activeOrder()!.created_at | date: 'dd/MM/yyyy HH:mm' }}
            </p>
          </div>
          <button
            (click)="closeDrawer()"
            class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-base transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0"
            style="border:1px solid var(--border);color:var(--text-secondary)"
          >
            ✕
          </button>
        </div>

        <!-- Drawer body (scrollable) -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- ① Résumé commande ───────────────────────────── -->
          <section>
            <h3
              class="font-bold text-xs uppercase tracking-widest mb-3"
              style="color:var(--text-secondary)"
            >
              📋 Résumé de la commande
            </h3>
            <div class="rounded-xl overflow-hidden" style="border:1px solid var(--border)">
              @for (item of activeOrder()!.items; track item.productId; let last = $last) {
                <div
                  class="flex items-center gap-3 px-4 py-3"
                  [style.border-bottom]="!last ? '1px solid var(--border)' : 'none'"
                >
                  @if (item.image) {
                    <img
                      [src]="item.image"
                      class="w-10 h-10 rounded-lg object-cover shrink-0"
                      style="border:1px solid var(--border)"
                    />
                  } @else {
                    <div
                      class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg"
                      style="background:var(--bg-secondary)"
                    >
                      💊
                    </div>
                  }
                  <div class="flex-1 min-w-0">
                    @if (item.productId) {
                      <button
                        (click)="openProduct(item.productId)"
                        class="text-sm font-medium truncate hover:underline text-left w-full block"
                        style="color:var(--text-primary);cursor:pointer"
                      >
                        {{ item.name_fr }}
                      </button>
                    } @else {
                      <p class="text-sm font-medium truncate" style="color:var(--text-primary)">
                        {{ item.name_fr }}
                      </p>
                    }
                    <p class="text-xs" style="color:var(--text-secondary)">
                      {{ item.unit_price | number: '1.2-2' }} TND × {{ item.quantity }}
                    </p>
                  </div>
                  <p class="text-sm font-bold shrink-0" style="color:var(--text-primary)">
                    {{ item.subtotal | number: '1.2-2' }} TND
                  </p>
                </div>
              }
              <div
                class="px-4 py-3 space-y-1.5"
                style="background:var(--bg-secondary);border-top:1px solid var(--border)"
              >
                <div class="flex justify-between text-sm">
                  <span style="color:var(--text-secondary)">Sous-total</span>
                  <span style="color:var(--text-primary)"
                    >{{ activeOrder()!.subtotal | number: '1.2-2' }} TND</span
                  >
                </div>
                <div class="flex justify-between text-sm">
                  <span style="color:var(--text-secondary)">Livraison</span>
                  @if (activeOrder()!.delivery_fee === 0) {
                    <span style="color:#16a34a" class="font-medium">Gratuite 🎉</span>
                  } @else {
                    <span style="color:var(--text-primary)"
                      >{{ activeOrder()!.delivery_fee | number: '1.2-2' }} TND</span
                    >
                  }
                </div>
                @if (activeOrder()!.discount_amount) {
                  <div class="flex justify-between text-sm px-3 py-2 rounded-lg" style="background:#f0fdf4;border:1px solid #bbf7d0">
                    <span class="font-medium" style="color:#16a34a">
                      🎟️ Coupon
                      @if (activeOrder()!.coupon_code) {
                        <span class="font-mono font-bold ml-1 px-1.5 py-0.5 rounded text-xs" style="background:#dcfce7">{{ activeOrder()!.coupon_code }}</span>
                      }
                    </span>
                    <span class="font-bold" style="color:#16a34a">-{{ activeOrder()!.discount_amount | number: '1.2-2' }} TND</span>
                  </div>
                }
                <div
                  class="flex justify-between font-bold text-base pt-1"
                  style="border-top:1px solid var(--border);margin-top:4px;padding-top:8px"
                >
                  <span style="color:var(--text-primary)">Total</span>
                  <span style="color:var(--primary)"
                    >{{ activeOrder()!.total | number: '1.2-2' }} TND</span
                  >
                </div>
              </div>
            </div>
          </section>

          <!-- ② Adresse ──────────────────────────────────── -->
          <section>
            <h3
              class="font-bold text-xs uppercase tracking-widest mb-3"
              style="color:var(--text-secondary)"
            >
              📍 Adresse de livraison
            </h3>
            <div
              class="rounded-xl p-4 space-y-1"
              style="background:var(--bg-secondary);border:1px solid var(--border)"
            >
              <p class="font-semibold" style="color:var(--text-primary)">
                {{ activeOrder()!.delivery_address.full_name }}
              </p>
              <p class="text-sm" style="color:var(--text-secondary)">
                📞 {{ activeOrder()!.delivery_address.phone }}
              </p>
              <p class="text-sm" style="color:var(--text-secondary)">
                🏠 {{ activeOrder()!.delivery_address.address }}
              </p>
              <p class="text-sm font-medium" style="color:var(--text-primary)">
                {{ activeOrder()!.delivery_address.city }},
                {{ activeOrder()!.delivery_address.wilaya }}
              </p>
            </div>
          </section>

          <!-- ③ Changer le statut ─────────────────────────── -->
          <section>
            <h3
              class="font-bold text-xs uppercase tracking-widest mb-3"
              style="color:var(--text-secondary)"
            >
              📡 Statut de la commande
            </h3>
            <div class="space-y-2">
              @for (s of statuses; track s) {
                <label
                  class="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all select-none"
                  [style.background]="
                    drawerStatus() === s ? 'var(--primary-light)' : 'var(--bg-secondary)'
                  "
                  [style.border]="
                    drawerStatus() === s
                      ? '1.5px solid var(--primary)'
                      : '1.5px solid var(--border)'
                  "
                >
                  <input
                    type="radio"
                    [value]="s"
                    [checked]="drawerStatus() === s"
                    (change)="drawerStatus.set(s)"
                    name="drawerStatus"
                    class="accent-[#008000]"
                  />
                  <span class="text-base">{{ statusIcon(s) }}</span>
                  <span
                    class="text-sm font-medium"
                    [style.color]="drawerStatus() === s ? 'var(--primary)' : 'var(--text-primary)'"
                  >
                    {{ statusLabel(s) }}
                  </span>
                </label>
              }
            </div>
            <button
              (click)="applyDrawerStatus()"
              [disabled]="drawerStatus() === activeOrder()!.status || updatingStatus()"
              class="btn-primary w-full justify-center mt-4 py-3"
              [class.opacity-50]="drawerStatus() === activeOrder()!.status || updatingStatus()"
            >
              @if (updatingStatus()) {
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Mise à jour…
              } @else {
                ✅ Appliquer le statut
              }
            </button>
          </section>

          <!-- ④ Documents ─────────────────────────────────── -->
          <section>
            <h3
              class="font-bold text-xs uppercase tracking-widest mb-3"
              style="color:var(--text-secondary)"
            >
              📄 Documents
            </h3>
            <div class="space-y-2">
              <button
                (click)="printInvoice(activeOrder()!)"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left"
                style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary)"
                onmouseover="this.style.borderColor='var(--primary)'"
                onmouseout="this.style.borderColor='var(--border)'"
              >
                <span class="text-xl">🧾</span>
                <div>
                  <p class="font-semibold">Générer la facture</p>
                  <p class="text-xs mt-0.5" style="color:var(--text-secondary)">
                    Facture complète avec détail des produits
                  </p>
                </div>
                <svg
                  class="w-4 h-4 ml-auto shrink-0"
                  style="color:var(--text-secondary)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </button>

              <button
                (click)="printDelivery(activeOrder()!)"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left"
                style="background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-primary)"
                onmouseover="this.style.borderColor='var(--primary)'"
                onmouseout="this.style.borderColor='var(--border)'"
              >
                <span class="text-xl">📦</span>
                <div>
                  <p class="font-semibold">Bon de livraison colis</p>
                  <p class="text-xs mt-0.5" style="color:var(--text-secondary)">
                    Étiquette expédition + contenu du colis
                  </p>
                </div>
                <svg
                  class="w-4 h-4 ml-auto shrink-0"
                  style="color:var(--text-secondary)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              </button>
            </div>
          </section>

          <!-- ⑤ Zone de danger ────────────────────────────── -->
          <section>
            <h3 class="font-bold text-xs uppercase tracking-widest mb-3" style="color:#dc2626">
              ⚠️ Zone de danger
            </h3>
            @if (!confirmingDelete()) {
              <button
                (click)="confirmingDelete.set(true)"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style="background:#fee2e2;border:1.5px solid #fca5a5;color:#dc2626"
              >
                <span class="text-xl">🗑️</span>
                <div class="text-left">
                  <p class="font-semibold">Supprimer la commande</p>
                  <p class="text-xs mt-0.5" style="color:#ef4444">Cette action est irréversible</p>
                </div>
              </button>
            } @else {
              <div class="p-4 rounded-xl" style="background:#fee2e2;border:1.5px solid #fca5a5">
                <p class="font-bold text-sm mb-1" style="color:#dc2626">
                  ⚠ Confirmer la suppression
                </p>
                <p class="text-xs mb-4" style="color:#ef4444">
                  La commande <strong>#{{ shortId(activeOrder()!.id!) }}</strong> sera
                  définitivement supprimée.
                </p>
                <div class="flex gap-2">
                  <button
                    (click)="confirmingDelete.set(false)"
                    class="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
                    style="background:white;border:1px solid var(--border);color:var(--text-primary)"
                  >
                    Annuler
                  </button>
                  <button
                    (click)="deleteOrder()"
                    class="flex-1 py-2 rounded-xl text-sm font-bold"
                    style="background:#dc2626;color:white"
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            }
          </section>
        </div>
      }
    </div>

    <!-- ══ PAGE CONTENT ════════════════════════════════════════ -->
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <h1 class="text-2xl font-extrabold" style="color:var(--text-primary)">
          {{ 'ORDERS.ADMIN_TITLE' | translate }}
          @if (!loading()) {
            <span
              class="ml-2 text-base font-medium px-2 py-0.5 rounded-lg"
              style="background:var(--bg-secondary);color:var(--text-secondary)"
            >
              ({{ filtered().length }})
            </span>
          }
        </h1>
      </div>

      <!-- Filters bar -->
      <div class="card p-4 flex flex-wrap gap-3">
        <div class="relative flex-1 min-w-52">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style="color:var(--text-secondary)"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            [value]="search()"
            (input)="onSearch($any($event.target).value)"
            placeholder="Rechercher email, nom, ID…"
            class="form-input pl-9 w-full"
          />
        </div>
        <select
          [value]="filterStatus()"
          (change)="filterStatus.set($any($event.target).value)"
          class="form-input w-auto"
        >
          <option value="">Tous les statuts</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ statusIcon(s) }} {{ statusLabel(s) }}</option>
          }
        </select>
        <select
          [value]="filterWilaya()"
          (change)="filterWilaya.set($any($event.target).value)"
          class="form-input w-auto"
        >
          <option value="">Toutes les gouvernements</option>
          @for (w of wilayas(); track w) {
            <option [value]="w">{{ w }}</option>
          }
        </select>
        @if (search() || filterStatus() || filterWilaya()) {
          <button (click)="resetFilters()" class="btn-secondary text-sm px-4">
            ✕ Réinitialiser
          </button>
        }
      </div>

      <!-- Table -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th class="w-10">
                  <input
                    type="checkbox"
                    (change)="toggleAll($any($event.target).checked)"
                    class="rounded"
                    style="accent-color:var(--primary)"
                  />
                </th>
                <th>Commande</th>
                <th>Client</th>
                <th>Produits</th>
                <th>Wilaya</th>
                <th (click)="setSort('total')" class="cursor-pointer select-none">
                  <span class="flex items-center gap-1"
                    >Total <span class="text-xs">{{ sortIcon('total') }}</span></span
                  >
                </th>
                <th>Statut</th>
                <th (click)="setSort('created_at')" class="cursor-pointer select-none">
                  <span class="flex items-center gap-1"
                    >Date <span class="text-xs">{{ sortIcon('created_at') }}</span></span
                  >
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @if (loading() || searching()) {
                @for (i of [1, 2, 3, 4, 5]; track i) {
                  <tr class="animate-pulse">
                    <td><div class="h-4 w-4 skeleton rounded"></div></td>
                    <td><div class="h-3 skeleton w-24 rounded"></div></td>
                    <td>
                      <div class="h-4 skeleton w-32 rounded mb-1"></div>
                      <div class="h-3 skeleton w-24 rounded"></div>
                    </td>
                    <td><div class="h-3 skeleton w-28 rounded"></div></td>
                    <td><div class="h-3 skeleton w-16 rounded"></div></td>
                    <td><div class="h-4 skeleton w-20 rounded"></div></td>
                    <td><div class="h-5 skeleton w-20 rounded-full"></div></td>
                    <td><div class="h-3 skeleton w-24 rounded"></div></td>
                    <td><div class="h-7 skeleton w-20 rounded-lg"></div></td>
                  </tr>
                }
              } @else if (filtered().length === 0) {
                <tr>
                  <td colspan="9" class="text-center py-16" style="color:var(--text-secondary)">
                    Aucune commande trouvée
                  </td>
                </tr>
              } @else {
                @for (order of filtered(); track order.id) {
                  <tr [class.selected-row]="isSelected(order.id!)">
                    <td>
                      <input
                        type="checkbox"
                        [checked]="isSelected(order.id!)"
                        (change)="toggleSelect(order.id!)"
                        class="rounded"
                        style="accent-color:var(--primary)"
                      />
                    </td>
                    <td>
                      <span
                        class="font-mono text-xs font-semibold"
                        style="color:var(--text-primary)"
                      >
                        #{{ shortId(order.id!) }}
                      </span>
                    </td>
                    <td>
                      <div class="font-medium text-sm" style="color:var(--text-primary)">
                        {{ order.delivery_address.full_name }}
                      </div>
                      <div class="text-xs" style="color:var(--text-secondary)">
                        {{ order.user_email }}
                      </div>
                      <div class="text-xs" style="color:var(--text-secondary)">
                        {{ order.delivery_address.phone }}
                      </div>
                    </td>
                    <td>
                      <div class="text-sm" style="color:var(--text-secondary)">
                        {{ summarizeItems(order) }}
                      </div>
                    </td>
                    <td>
                      <span class="text-sm" style="color:var(--text-secondary)">{{
                        order.delivery_address.wilaya
                      }}</span>
                    </td>
                    <td>
                      <div class="font-semibold text-sm" style="color:var(--primary)">
                        {{ order.total | number: '1.2-2' }} TND
                      </div>
                      @if (order.discount_amount) {
                        <div class="text-xs font-medium" style="color:#16a34a">
                          🎟️ -{{ order.discount_amount | number: '1.2-2' }} TND
                        </div>
                      } @else {
                        <div class="text-xs" style="color:var(--text-secondary)">
                          +{{ order.delivery_fee }} livraison
                        </div>
                      }
                    </td>
                    <td>
                      <span [class]="'badge ' + getStatusClass(order.status)">
                        {{ statusIcon(order.status) }} {{ statusLabel(order.status) }}
                      </span>
                    </td>
                    <td>
                      <div class="text-sm" style="color:var(--text-primary)">
                        {{ order.created_at | date: 'dd/MM/yyyy' }}
                      </div>
                      <div class="text-xs" style="color:var(--text-secondary)">
                        {{ order.created_at | date: 'HH:mm' }}
                      </div>
                    </td>
                    <td>
                      <button
                        (click)="openDrawer(order)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        [style.background]="
                          activeOrder()?.id === order.id ? 'var(--primary)' : 'var(--bg-secondary)'
                        "
                        [style.color]="
                          activeOrder()?.id === order.id ? 'white' : 'var(--text-primary)'
                        "
                        style="border:1px solid var(--border)"
                      >
                        <svg
                          class="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        Actions
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Bulk action bar -->
        @if (selected().size > 0) {
          <div
            class="border-t px-5 py-3 flex items-center gap-3 flex-wrap"
            style="border-color:var(--border);background:var(--bg-secondary)"
          >
            <span class="text-sm font-medium" style="color:var(--text-secondary)">
              {{ selected().size }} sélectionnée(s)
            </span>
            <select
              [(ngModel)]="bulkStatus"
              class="form-input text-sm py-1 px-2 w-auto"
              style="height:auto"
            >
              <option value="">Changer le statut…</option>
              @for (s of statuses; track s) {
                <option [value]="s">{{ statusIcon(s) }} {{ statusLabel(s) }}</option>
              }
            </select>
            <button
              (click)="applyBulk()"
              [disabled]="!bulkStatus"
              class="btn-primary text-sm py-1.5 px-4"
            >
              Appliquer
            </button>
            <button (click)="clearSelection()" class="btn-secondary text-sm py-1.5 px-4">
              Désélectionner
            </button>
          </div>
        }

        @if (!loading() && filtered().length > 0) {
          <div
            class="border-t px-5 py-3 text-xs"
            style="border-color:var(--border);color:var(--text-secondary)"
          >
            {{ filtered().length }} commande(s) affichée(s) sur {{ orders().length }} au total
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminOrdersComponent {
  private orderSvc = inject(OrderService);
  private toast = inject(ToastService);
  private progress = inject(ProgressService);

  openProduct(productId: number | string): void {
    window.open('/products/' + productId, '_blank');
  }

  protected loading = signal(true);
  protected searching = signal(false);
  protected orders = signal<Order[]>([]);
  protected statuses = STATUSES;
  protected search = signal('');
  private debouncedSearch = signal('');
  protected filterStatus = signal('');
  protected filterWilaya = signal('');
  protected sortField = signal<SortField>('created_at');
  protected sortDir = signal<SortDir>('desc');
  protected selected = signal<Set<number | string>>(new Set());
  protected bulkStatus = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  // Drawer state
  protected drawerOpen = signal(false);
  protected activeOrder = signal<Order | null>(null);
  protected drawerStatus = signal<OrderStatus>('pending');
  protected updatingStatus = signal(false);
  protected confirmingDelete = signal(false);

  protected wilayas = computed(() =>
    [
      ...new Set(
        this.orders()
          .map((o) => o.delivery_address.wilaya)
          .filter(Boolean),
      ),
    ].sort(),
  );

  protected filtered = computed(() => {
    const q = this.debouncedSearch().toLowerCase();
    const fs = this.filterStatus();
    const fw = this.filterWilaya();
    let list = this.orders().filter((o) => {
      if (fs && o.status !== fs) return false;
      if (fw && o.delivery_address.wilaya !== fw) return false;
      if (
        q &&
        ![o.user_email, o.delivery_address.full_name, String(o.id ?? '')].some((v) =>
          v?.toLowerCase().includes(q),
        )
      )
        return false;
      return true;
    });
    const field = this.sortField();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      const va = a[field] ?? '';
      const vb = b[field] ?? '';
      return va < vb ? -dir : va > vb ? dir : 0;
    });
    return list;
  });

  constructor() {
    this.progress.start();
    this.orderSvc
      .getAll()
      .pipe(
        tap(() => {
          this.loading.set(false);
          this.progress.complete();
        }),
        takeUntilDestroyed(),
      )
      .subscribe((list) => this.orders.set(list));
  }

  // ── Drawer ───────────────────────────────────────────────────

  openDrawer(order: Order): void {
    this.activeOrder.set(order);
    this.drawerStatus.set(order.status);
    this.confirmingDelete.set(false);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    setTimeout(() => {
      this.activeOrder.set(null);
      this.confirmingDelete.set(false);
    }, 300);
  }

  async applyDrawerStatus(): Promise<void> {
    const order = this.activeOrder();
    if (!order?.id) return;
    const newStatus = this.drawerStatus();
    if (newStatus === order.status) return;
    this.updatingStatus.set(true);
    try {
      await this.orderSvc.updateStatus(order.id, newStatus);
      this.orders.update((list) =>
        list.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)),
      );
      this.activeOrder.update((o) => (o ? { ...o, status: newStatus } : o));
      this.toast.success('Statut mis à jour avec succès.');
    } catch (e: any) {
      this.toast.error(e.message ?? 'Erreur lors de la mise à jour.');
    } finally {
      this.updatingStatus.set(false);
    }
  }

  async deleteOrder(): Promise<void> {
    const order = this.activeOrder();
    if (!order?.id) return;
    try {
      await this.orderSvc.delete(order.id);
      this.orders.update((list) => list.filter((o) => o.id !== order.id));
      this.toast.success('Commande supprimée.');
      this.closeDrawer();
    } catch (e: any) {
      this.toast.error(e.message ?? 'Erreur lors de la suppression.');
      this.confirmingDelete.set(false);
    }
  }

  // ── Print: Facture ───────────────────────────────────────────

  printInvoice(order: Order): void {
    const date = new Date(order.created_at ?? '').toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const shortId = this.shortId(order.id!);
    const addr = order.delivery_address;
    const items = order.items
      .map(
        (i) => `
      <tr>
        <td>${i.name_fr}</td>
        <td style="text-align:center">${i.quantity}</td>
        <td style="text-align:right">${i.unit_price.toFixed(2)} TND</td>
        <td style="text-align:right;font-weight:bold">${i.subtotal.toFixed(2)} TND</td>
      </tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
<title>Facture #${shortId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; font-size: 14px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
  .brand { font-size: 22px; font-weight: 900; color: #006400; }
  .brand-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
  .invoice-title { font-size: 28px; font-weight: 900; color: #1e293b; text-align: right; }
  .invoice-ref { font-size: 13px; color: #64748b; text-align: right; margin-top: 6px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .info-box { background: #f8fafc; border-radius: 10px; padding: 16px; border: 1px solid #e2e8f0; }
  .info-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 8px; }
  .info-box p { color: #1e293b; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #006400; color: white; padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  thead th:nth-child(2), thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  .totals { margin-left: auto; width: 280px; }
  .totals table { border: none; }
  .totals td { border: none !important; padding: 6px 8px !important; background: none !important; }
  .totals .grand-total { font-size: 18px; font-weight: 900; color: #006400; border-top: 2px solid #006400 !important; padding-top: 12px !important; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; background: #dcfce7; color: #166534; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 11px; color: #94a3b8; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <div>
    <div class="brand">💊 MedicareInaya</div>
    <div class="brand-sub">Pharmacie & Parapharmacie en ligne · Tunisie</div>
  </div>
  <div>
    <div class="invoice-title">FACTURE</div>
    <div class="invoice-ref">#${shortId} · <span class="badge">${STATUS_LABELS[order.status] ?? order.status}</span></div>
    <div class="invoice-ref">Émise le ${date}</div>
  </div>
</div>

<div class="info-grid">
  <div class="info-box">
    <h3>Facturé à</h3>
    <p><strong>${addr.full_name}</strong><br/>
    📞 ${addr.phone}<br/>
    📍 ${addr.address}<br/>
    ${addr.city}, <strong>${addr.wilaya}</strong></p>
  </div>
  <div class="info-box">
    <h3>Détails de la commande</h3>
    <p>Référence : <strong>#${shortId}</strong><br/>
    Date : ${date}<br/>
    Paiement : Paiement à la livraison (COD)<br/>
    Email : ${order.user_email}</p>
  </div>
</div>

<table>
  <thead><tr>
    <th>Produit</th>
    <th style="text-align:right">Qté</th>
    <th style="text-align:right">Prix unitaire</th>
    <th style="text-align:right">Total</th>
  </tr></thead>
  <tbody>${items}</tbody>
</table>

<div class="totals">
  <table>
    <tr><td>Sous-total</td><td style="text-align:right">${order.subtotal.toFixed(2)} TND</td></tr>
    <tr><td>Livraison</td><td style="text-align:right">${order.delivery_fee === 0 ? 'Gratuite 🎉' : order.delivery_fee.toFixed(2) + ' TND'}</td></tr>
    ${order.discount_amount ? `<tr><td style="color:#16a34a">🎟️ Coupon${order.coupon_code ? ` <strong>${order.coupon_code}</strong>` : ''}</td><td style="text-align:right;color:#16a34a;font-weight:bold">-${order.discount_amount.toFixed(2)} TND</td></tr>` : ''}
    <tr class="grand-total"><td><strong>TOTAL</strong></td><td style="text-align:right"><strong>${order.total.toFixed(2)} TND</strong></td></tr>
  </table>
</div>

<div class="footer">
  Merci pour votre confiance — MedicareInaya · medicareinaya.tn<br/>
  Document généré le ${new Date().toLocaleString('fr-TN')}
</div>
</body></html>`;

    this.openPrintWindow(html, `Facture-${shortId}`);
  }

  // ── Print: Bon de livraison ──────────────────────────────────

  printDelivery(order: Order): void {
    const date = new Date(order.created_at ?? '').toLocaleDateString('fr-TN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const shortId = this.shortId(order.id!);
    const addr = order.delivery_address;
    const items = order.items
      .map(
        (i) => `
      <tr>
        <td>${i.name_fr}</td>
        <td style="text-align:center;font-weight:bold">${i.quantity}</td>
      </tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>
<title>Bon de livraison #${shortId}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 30px; font-size: 14px; }
  .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1e293b; }
  .brand { font-size: 20px; font-weight: 900; color: #006400; }
  .ref-block { text-align: right; }
  .ref-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; }
  .ref-num { font-size: 26px; font-weight: 900; color: #1e293b; }
  .ref-date { font-size: 12px; color: #64748b; }
  .addr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .addr-box { border: 2px solid #e2e8f0; border-radius: 10px; padding: 16px; }
  .addr-box.dest { border-color: #006400; border-width: 3px; }
  .addr-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 10px; font-weight: bold; }
  .dest-name { font-size: 20px; font-weight: 900; color: #1e293b; margin-bottom: 6px; }
  .dest-wilaya { font-size: 22px; font-weight: 900; color: #006400; margin-top: 6px; }
  .separator { border: none; border-top: 2px dashed #94a3b8; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #1e293b; color: white; padding: 8px 12px; text-align: left; font-size: 12px; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .total-box { background: #f8fafc; border: 2px solid #006400; border-radius: 10px; padding: 16px; display: flex; justify-content: space-between; align-items: center; }
  .total-label { font-size: 13px; color: #64748b; }
  .total-amount { font-size: 24px; font-weight: 900; color: #006400; }
  .cod-badge { display: inline-block; background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }
  .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; padding-top: 16px; border-top: 1px dashed #cbd5e1; }
  @media print { body { padding: 15px; } }
</style></head><body>

<div class="header-row">
  <div>
    <div class="brand">💊 MedicareInaya</div>
    <div style="font-size:12px;color:#64748b;margin-top:3px">Bon de livraison colis</div>
  </div>
  <div class="ref-block">
    <div class="ref-label">Référence commande</div>
    <div class="ref-num">#${shortId}</div>
    <div class="ref-date">${date}</div>
  </div>
</div>

<div class="addr-grid">
  <div class="addr-box">
    <div class="addr-label">📦 Expéditeur</div>
    <p><strong>MedicareInaya</strong></p>
    <p style="font-size:13px;color:#64748b;margin-top:4px">Tunisie<br/>medicareinaya.tn</p>
  </div>
  <div class="addr-box dest">
    <div class="addr-label">📍 Destinataire</div>
    <div class="dest-name">${addr.full_name}</div>
    <p style="font-size:13px;margin-top:4px">📞 <strong>${addr.phone}</strong></p>
    <p style="font-size:13px;margin-top:2px">🏠 ${addr.address}</p>
    <p style="font-size:13px;margin-top:2px">${addr.city}</p>
    <div class="dest-wilaya">${addr.wilaya}</div>
  </div>
</div>

<hr class="separator" />

<h3 style="margin-bottom:12px;font-size:14px;color:#1e293b">📦 Contenu du colis (${order.items.length} article${order.items.length > 1 ? 's' : ''})</h3>
<table>
  <thead><tr><th>Produit</th><th style="text-align:center;width:80px">Qté</th></tr></thead>
  <tbody>${items}</tbody>
</table>

<div class="total-box">
  <div>
    <div class="total-label">Montant à encaisser</div>
    <div class="cod-badge">💵 Paiement à la livraison</div>
  </div>
  <div class="total-amount">${order.total.toFixed(2)} TND</div>
</div>

<div class="footer">
  Merci de manipuler ce colis avec soin — MedicareInaya<br/>
  Généré le ${new Date().toLocaleString('fr-TN')} · Réf: #${shortId}
</div>
</body></html>`;

    this.openPrintWindow(html, `Livraison-${shortId}`);
  }

  private openPrintWindow(html: string, title: string): void {
    const win = window.open('', title, 'width=850,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  }

  // ── Table helpers ─────────────────────────────────────────────

  onSearch(value: string): void {
    this.search.set(value);
    this.searching.set(true);
    this.progress.start();
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.debouncedSearch.set(value);
      this.searching.set(false);
      this.progress.complete();
    }, 350);
  }

  setSort(field: SortField): void {
    if (this.sortField() === field) this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      this.sortField.set(field);
      this.sortDir.set('desc');
    }
  }

  sortIcon(field: SortField): string {
    if (this.sortField() !== field) return '↕';
    return this.sortDir() === 'asc' ? '↑' : '↓';
  }

  getStatusClass(status: string): string {
    return STATUS_CLASSES[status] ?? 'badge-primary';
  }
  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }
  statusIcon(status: string): string {
    return STATUS_ICONS[status] ?? '';
  }
  shortId(id: number | string): string {
    return String(id).substring(0, 8).toUpperCase();
  }

  summarizeItems(order: Order): string {
    const first = order.items[0];
    const rest = order.items.length - 1;
    const label = `${first?.name_fr} ×${first?.quantity}`;
    return rest > 0 ? `${label} +${rest} autre(s)` : label;
  }

  resetFilters(): void {
    this.search.set('');
    this.debouncedSearch.set('');
    this.filterStatus.set('');
    this.filterWilaya.set('');
    this.searching.set(false);
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  toggleSelect(id: number | string): void {
    this.selected.update((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isSelected(id: number | string): boolean {
    return this.selected().has(id);
  }

  toggleAll(checked: boolean): void {
    this.selected.set(checked ? new Set(this.filtered().map((o) => o.id!)) : new Set<number | string>());
  }

  clearSelection(): void {
    this.selected.set(new Set());
    this.bulkStatus = '';
  }

  async applyBulk(): Promise<void> {
    if (!this.bulkStatus) return;
    const ids = [...this.selected()];
    this.orders.update((list) =>
      list.map((o) => (ids.includes(o.id!) ? { ...o, status: this.bulkStatus as OrderStatus } : o)),
    );
    try {
      await Promise.all(
        ids.map((id) => this.orderSvc.updateStatus(id, this.bulkStatus as OrderStatus)),
      );
      this.toast.success(`${ids.length} commande(s) mise(s) à jour.`);
    } catch (e: any) {
      this.toast.error(e.message ?? 'Erreur lors de la mise à jour groupée.');
    }
    this.clearSelection();
  }

  async changeStatus(id: number | string, status: OrderStatus): Promise<void> {
    this.orders.update((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await this.orderSvc.updateStatus(id, status);
      this.toast.success('Commande mise à jour avec succès.');
    } catch (e: any) {
      this.toast.error(e.message ?? 'Erreur lors de la mise à jour.');
    }
  }
}
