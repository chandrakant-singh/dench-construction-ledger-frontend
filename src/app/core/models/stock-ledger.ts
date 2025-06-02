export interface StockLedgerEntry {
  id?: string;              // Firestore doc ID
  stockIn: number;
  stockOut: number;
  balance: number;
  description: string;
  date: string;             // YYYY-MM-DD
  createdBy: string;        // Firestore doc ID
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}
