export interface Review {
  id?: number;
  order_id: number | string;
  rating: number;
  comment?: string;
  first_name?: string;
  published?: boolean;
  user_email?: string;
  created_at?: string;
}
