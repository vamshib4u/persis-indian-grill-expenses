export interface DailySales {
  id: string;
  restaurantId: string;
  date: Date | string;
  squareSales: number;
  cashCollected: number;
  cashHolder: string;
  notes?: string;
  createdAt: Date | string;
}

export interface CashHolder {
  name: string;
  totalCash: number;
}

export interface Transaction {
  id: string;
  restaurantId: string;
  date: Date | string;
  type: 'expense' | 'payout';
  category: string;
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer';
  spentBy?: string;
  payeeName?: string;
  purpose?: string;
  notes?: string;
  createdAt: Date | string;
}

export interface CateringOrder {
  id: string;
  restaurantId: string;
  readyAt: Date | string;
  fulfillmentType: 'pickup' | 'delivery' | 'banquet_hall';
  depositAmount: number;
  depositPaidDate?: Date | string;
  depositCashHolder?: string;
  finalPaymentAmount: number;
  finalPaymentDate?: Date | string;
  finalPaymentCashHolder?: string;
  notes?: string;
  createdAt: Date | string;
}

export interface MonthlyReport {
  month: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalPayouts: number;
  netCash: number;
  squareSales: number;
  unreportedCash: number;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  createdAt: Date | string;
}

export interface CashHolderConfig {
  id: string;
  name: string;
  startingAmount: number;
  active: boolean;
  createdAt: Date | string;
}

export interface CashHolderAdminConfig extends CashHolderConfig {
  visibleRestaurantIds: string[];
  startingAmountsByRestaurant: Record<string, number>;
}

export type UserRole = 'restaurant_admin' | 'super_admin';

export interface AppUser {
  id: string;
  username: string;
  role: UserRole;
  restaurantIds: string[];
  active: boolean;
  createdAt: Date | string;
}

export interface SessionData {
  user: AppUser;
  activeRestaurantId: string;
  restaurants: Restaurant[];
}

export interface DataExport {
  sales: DailySales[];
  transactions: Transaction[];
  cateringOrders?: CateringOrder[];
  generatedAt: Date;
}
