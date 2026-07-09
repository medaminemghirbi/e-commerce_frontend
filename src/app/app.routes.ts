import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // ──── Public Layout ────
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/public/products/product-list/product-list.component').then(m => m.ProductListComponent),
          },
          {
            path: ':id',
            loadComponent: () => import('./features/public/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
          },
        ],
      },
      {
        path: 'marques/:id',
        loadComponent: () => import('./features/public/marques/marque-detail.component').then(m => m.MarqueDetailComponent),
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/public/contact/contact.component').then(m => m.ContactComponent),
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/public/cart/cart.component').then(m => m.CartComponent),
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/public/wishlist/wishlist.component').then(m => m.WishlistComponent),
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/public/checkout/checkout.component').then(m => m.CheckoutComponent),
      },
      {
        path: 'faq',
        loadComponent: () => import('./features/public/faq/faq.component').then(m => m.FaqComponent),
      },
      {
        path: 'astuces',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/public/astuces/astuces-list.component').then(m => m.AstucesListComponent),
          },
          {
            path: ':id',
            loadComponent: () => import('./features/public/astuces/astuce-detail.component').then(m => m.AstuceDetailComponent),
          },
        ],
      },
      {
        path: 'client',
        children: [
          {
            path: 'orders',
            loadComponent: () => import('./features/client/orders/client-orders.component').then(m => m.ClientOrdersComponent),
          },
        ],
      },
      {
        path: 'auth',
        children: [
          {
            path: 'login',
            loadComponent: () => import('./features/public/auth/login/login.component').then(m => m.LoginComponent),
          },
          {
            path: 'register',
            loadComponent: () => import('./features/public/auth/register/register.component').then(m => m.RegisterComponent),
          },
        ],
      },
    ],
  },

  // ──── Admin Layout ────
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'products',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/products/product-list/admin-product-list.component').then(m => m.AdminProductListComponent),
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/products/product-form/product-form.component').then(m => m.ProductFormComponent),
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/admin/products/product-form/product-form.component').then(m => m.ProductFormComponent),
          },
        ],
      },
      {
        path: 'categories',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/categories/category-list/admin-category-list.component').then(m => m.AdminCategoryListComponent),
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/admin/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
          },
        ],
      },
      {
        path: 'marques',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/marques/admin-marque-list.component').then(m => m.AdminMarqueListComponent),
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/marques/marque-form.component').then(m => m.MarqueFormComponent),
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/admin/marques/marque-form.component').then(m => m.MarqueFormComponent),
          },
        ],
      },
      {
        path: 'contacts',
        loadComponent: () => import('./features/admin/contacts/admin-contacts.component').then(m => m.AdminContactsComponent),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/admin/notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/admin/orders/admin-orders.component').then(m => m.AdminOrdersComponent),
      },
      {
        path: 'coupons',
        loadComponent: () => import('./features/admin/coupons/admin-coupon-list.component').then(m => m.AdminCouponListComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/admin/settings/admin-settings.component').then(m => m.AdminSettingsComponent),
      },
      {
        path: 'faqs',
        loadComponent: () => import('./features/admin/faqs/admin-faqs.component').then(m => m.AdminFaqsComponent),
      },
      {
        path: 'reviews',
        loadComponent: () => import('./features/admin/reviews/admin-reviews.component').then(m => m.AdminReviewsComponent),
      },
      {
        path: 'astuces',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/astuces/admin-astuces-list.component').then(m => m.AdminAstucesListComponent),
          },
          {
            path: 'new',
            loadComponent: () => import('./features/admin/astuces/admin-astuce-form.component').then(m => m.AdminAstuceFormComponent),
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./features/admin/astuces/admin-astuce-form.component').then(m => m.AdminAstuceFormComponent),
          },
        ],
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
