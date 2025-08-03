export interface PartyMainCategoryMap {
  id?: string;
  partyId: string;
  mainCategoryId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}

export interface PartyMainCategoryMapReq {
  id: string;
  partyId: string;
  mainCategoryId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
} 