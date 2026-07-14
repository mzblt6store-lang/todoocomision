export interface SupabaseConfig {
  connectionString: string;
  isEnabled: boolean;
  isConnected: boolean;
  lastSynced?: string;
}

export interface OdooCompany {
  id: number;
  name: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'company_admin' | 'cashier';
  companyId?: number; // Optional Odoo Company ID
  companyName?: string; // Optional Odoo Company Name
}

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  password?: string; // Optional on return for security, but set on save
  isDemo: boolean;
  isConnected: boolean;
  lastSyncedProducts?: string;
  lastSyncedSales?: string;
  supabase?: SupabaseConfig; // Optional configuration for Supabase integration
  companies?: OdooCompany[]; // Available companies
  userProfiles?: UserProfile[]; // Configured profiles
  activeProfileId?: string; // Currently active profile ID
}

export type CommissionType = 'fixed' | 'percentage' | 'none';

export interface ProductCommission {
  id: number;
  name: string;
  default_code?: string; // SKU or internal reference
  list_price: number;
  commission_type: CommissionType;
  commission_value: number; // Flat Soles/Dollars OR percentage value (0-100)
  company_id?: number; // Optional Odoo Company ID
  company_name?: string; // Optional Odoo Company Name
}

export interface CommissionSaleOrderLine {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_unit: number;
  price_subtotal: number;
  commission_earned: number; // Calculated commission for this line
}

export interface CommissionSaleOrder {
  id: number;
  name: string; // Order Number, e.g. SO001
  date_order: string; // ISO date
  amount_total: number;
  salesperson_id: number;
  salesperson_name: string;
  commission_total: number; // Sum of lines' commission_earned
  status: 'pending' | 'paid';
  lines: CommissionSaleOrderLine[];
  company_id?: number; // Optional Odoo Company ID
  company_name?: string; // Optional Odoo Company Name
}

export interface SalespersonStats {
  id: number;
  name: string;
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  order_count: number;
}

export interface DashboardStats {
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  commissioned_products_count: number;
  total_orders_count: number;
  top_salesperson: { name: string; amount: number } | null;
}
