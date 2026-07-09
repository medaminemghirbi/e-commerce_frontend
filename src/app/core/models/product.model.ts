export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id?: number | string;
  category_id: number | string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  description_ar: string;
  description_fr: string;
  description_en: string;
  price: number;
  stock_quantity: number;
  manufacture_date?: string;
  expiration_date?: string;
  images: string[];
  barcode?: string;
  keywords?: string[];
  subcategory_ids?: (number | string)[];
  subcategories_detail?: { id: number | string; name_fr: string; icon?: string }[];
  category?: { id: number | string; name_fr: string; icon?: string };
  marque_id?: number | string;
  marque?: { id: number | string; name: string; image?: string };
  status: ProductStatus;
  has_promotion?: boolean;
  promotion_discount?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}


export function isLowStock(product: Product): boolean {
  return product.stock_quantity <= 2;
}

export function isNearExpiration(product: Product): boolean {
  if (!product.expiration_date) return false;
  const days = Math.ceil((new Date(product.expiration_date).getTime() - Date.now()) / 86400000);
  return days > 0 && days <= 30;
}

export function shouldHavePromotion(product: Product): boolean {
  if (!product.expiration_date) return false;
  const days = Math.ceil((new Date(product.expiration_date).getTime() - Date.now()) / 86400000);
  return days > 0 && days <= 60;
}
