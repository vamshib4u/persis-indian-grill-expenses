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

export type FoodCostRecordType = 'ingredient' | 'operating_cost' | 'menu_item';

export interface IngredientPrice {
  id: string;
  restaurantId: string;
  name: string;
  itemCode?: string;
  category?: string;
  packageQuantity: number;
  packageUnit: string;
  packagePrice: number;
  priceDate: Date | string;
  source?: string;
  notes?: string;
  createdAt: Date | string;
}

export type OperatingCostType = 'employee' | 'utility' | 'rent' | 'packaging' | 'gas' | 'electricity' | 'other';
export type PayCycle = 'hourly' | 'weekly' | 'biweekly' | 'monthly' | 'one_time';

export interface OperatingCost {
  id: string;
  restaurantId: string;
  costType: OperatingCostType;
  name: string;
  designation?: string;
  amount: number;
  payCycle: PayCycle;
  hoursPerCycle: number;
  monthlyAmount: number;
  effectiveDate: Date | string;
  notes?: string;
  createdAt: Date | string;
}

export interface MenuIngredient {
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface MenuItemCost {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  servingSize: number;
  servingUnit: string;
  salePrice: number;
  gasCost: number;
  electricityCost: number;
  packagingCost: number;
  laborCost: number;
  otherCost: number;
  ingredients: MenuIngredient[];
  createdAt: Date | string;
}

export interface DataExport {
  sales: DailySales[];
  transactions: Transaction[];
  cateringOrders?: CateringOrder[];
  generatedAt: Date;
}
