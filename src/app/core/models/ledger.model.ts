export interface LedgerEntry {
  id?: string;              // Firestore doc ID
  amount: number;
  balance: number;
  debit: number;
  credit: number;
  description: string;
  hintBy: string;
  modeOfPayment: string;
  depositedBy: string;
  debitedBy: string;
  date: string;             // ISO date string (e.g. '2024-04-20')
  verifiedBy: string;
  createdBy: string;        // UID of supervisor/admin
  updatedBy?: string;
  createdAt: Date;
  createdByName?: string;
  updatedAt?: Date;
  status: string;
}
