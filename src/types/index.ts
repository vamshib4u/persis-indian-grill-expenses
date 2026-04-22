export interface DailySales {
  id: string;
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

export interface DataExport {
  sales: DailySales[];
  transactions: Transaction[];
  generatedAt: Date;
}
