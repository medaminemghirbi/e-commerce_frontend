export interface WishlistItem {
  productId: number | string;
  name_fr: string;
  name_en: string;
  name_ar: string;
  image: string;
  price: number;
  has_promotion: boolean;
  promotion_discount: number;
}
