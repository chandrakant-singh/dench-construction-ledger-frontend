export interface StoreLedgerCategory {
  id?: string,
  category: { 
    [mainCategory: string]: {
      [party: string]: string[] | null
    }
  };
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}
