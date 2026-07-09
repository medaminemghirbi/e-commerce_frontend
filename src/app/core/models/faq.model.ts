export interface Faq {
  id: number;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  active: boolean;
  created_at?: string;
}
