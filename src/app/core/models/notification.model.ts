export type NotificationType = 'low_stock' | 'near_expiration' | 'promotion' | 'contact_request';

export interface AppNotification {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  product_id?: string;
  contact_id?: string;
  read: boolean;
  created_at?: Date;
}
