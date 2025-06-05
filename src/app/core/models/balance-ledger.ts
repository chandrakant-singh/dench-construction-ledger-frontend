export interface BalanceLedgerEntry {
  id?: string;
  itemName: string;
  itemId: string;
  quantity: number;
  rate: number;
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
  itemName: string;
  itemId: string;
  quantity: number;
  rate: number;
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
