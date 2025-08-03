export interface BalanceLedgerEntry {
  id?: string;
  party: string;
  mainCategory: string;
  subCategory: string;
  itemName: string;
  itemId: string;
  quantity: number;
  rate: number;
  unit: string;
  amount: number;
  credit: number;
  balance: number;
  description: string;
  date: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}

export interface BalanceLedgerEntryReq {
  id: string;
  party: string;
  mainCategory: string;
  subCategory: string;
  itemName: string;
  itemId: string;
  quantity: number;
  rate: number;
  unit: string;
  amount: number;
  credit: number;
  balance: number;
  description: string;
  date: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}

export interface BalanceLedgerItem {
  id?: string;
  name: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}
