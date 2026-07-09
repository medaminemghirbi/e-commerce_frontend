export interface DashboardKpis {
  total_revenue: number;
  monthly_revenue: number;
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  cancelled_orders: number;
  new_orders_today: number;
  total_products: number;
  active_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_clients: number;
  total_categories: number;
  contact_requests: number;
  pending_contacts: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface OrdersByDay {
  date: string;
  count: number;
}

export interface TopSellingProduct {
  id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
}

export interface TopContactedProduct {
  id: number;
  name: string;
  contact_count: number;
}

export interface TopViewedProduct {
  id: number;
  name: string;
  image: string;
  views_count: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  stock_quantity: number;
}

export interface RecentOrder {
  id: number;
  client_name: string;
  total: number;
  status: string;
  created_at: string;
}

export interface DashboardData {
  kpis: DashboardKpis;
  revenue_by_month: RevenueByMonth[];
  orders_by_status: Record<string, number>;
  orders_by_day: OrdersByDay[];
  top_selling_products: TopSellingProduct[];
  top_contacted_products: TopContactedProduct[];
  top_viewed_products: TopViewedProduct[];
  low_stock_products: LowStockProduct[];
  recent_orders: RecentOrder[];
}
