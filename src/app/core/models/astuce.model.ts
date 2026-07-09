export interface Astuce {
  id?: number;
  title: string;
  description?: string;
  images: string[];
  category: string;
  product_id?: number | null;
  product_name?: string;
  active?: boolean;
  sort_order?: number;
  created_at?: string;
}
