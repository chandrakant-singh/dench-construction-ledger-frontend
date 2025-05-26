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
  approvedBy: string;
  createdBy: string;        // UID of supervisor/admin
  updatedBy?: string;
  createdAt: Date;
  createdByName?: string;
  updatedAt?: Date;
  status: string;
  approvedByName?: string;
  depositedByName?: string;
  debitedByName?: string;
}

export interface LedgerEntryReq {
  id: string;              // Firestore doc ID
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
  approvedBy: string;
  createdBy: string;        // UID of supervisor/admin
  updatedBy: string;
  createdAt: Date;
  createdByName: string;
  updatedAt: Date;
  status: string;
  approvedByName?: string;
  depositedByName?: string;
  debitedByName?: string;
}

export class LedgerEntryModel {
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
  approvedBy: string;
  createdBy: string;        // UID of supervisor/admin
  updatedBy?: string;
  createdAt: Date;
  createdByName?: string;
  updatedAt?: Date;
  status: string;

  constructor(entry: LedgerEntry) {
    this.id = entry.id;
    this.amount = entry.amount;
    this.balance = entry.balance;
    this.debit = entry.debit;
    this.credit = entry.credit;
    this.description = entry.description;
    this.hintBy = entry.hintBy;
    this.modeOfPayment = entry.modeOfPayment;
    this.depositedBy = entry.depositedBy;
    this.debitedBy = entry.debitedBy;
    this.date = entry.date;
    this.approvedBy = entry.approvedBy;
    this.createdBy = entry.createdBy;
    this.updatedBy = entry.updatedBy;
    this.createdAt = entry.createdAt;
    this.createdByName = entry.createdByName;
    this.updatedAt = entry.updatedAt;
    this.status = entry.status;
  }
}
