
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock?: number;
}

export type TransactionType = 'PURCHASE' | 'PAYMENT';

export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  type: TransactionType;
  description: string;
  timestamp: number;
  items?: { productId: string; name: string; quantity: number; price: number }[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  lastUpdated: number;
}

export interface KiranaState {
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
}
