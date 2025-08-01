export interface StockLedgerEntry {
  id?: string;
  mainCategory: string;
  party: string;
  subCategory: string;
  stockIn: number;
  stockOut: number;
  balance: number;
  description: string;
  date: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}
