export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id?: number | string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  description?: string;
  min_order_amount?: number;
  max_uses?: number;
  uses_count?: number;
  expires_at?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface AppliedCoupon {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  discount_amount: number;
}

export interface CouponValidateResponse {
  valid: boolean;
  message?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  discount_amount?: number;
}
