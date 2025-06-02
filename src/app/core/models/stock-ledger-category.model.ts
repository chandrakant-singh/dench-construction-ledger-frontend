export interface StoreLedgerCategory {
  id?: string,
  category: { [key: string]: [string | null] };
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}
