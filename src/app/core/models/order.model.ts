export interface OrderItem {
  productId: number | string;
  name_fr: string;
  image?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface DeliveryAddress {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  wilaya: string;
  email?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id?: number | string;
  user_id: number | string | null;
  user_email: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount_amount?: number;
  coupon_code?: string;
  total: number;
  status: OrderStatus;
  payment_method: 'cod';
  delivery_address: DeliveryAddress;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
