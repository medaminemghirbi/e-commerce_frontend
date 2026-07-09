export interface Subcategory {
  id?: number | string;
  category_id: number | string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  description?: string;
  icon?: string;
  created_at?: Date;
  updated_at?: Date;
}
