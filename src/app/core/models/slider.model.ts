export interface SliderImage {
  id?:         number | string;
  title?:      string;
  subtitle?:   string;
  image_url:   string;
  link_url?:   string;
  link_label?: string;
  sort_order:  number;
  active:      boolean;
  created_at?: string;
}
