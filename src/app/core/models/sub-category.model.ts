export interface SubCategory {
  id?: string;
  name: string;
  mainCategoryId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}

export interface SubCategoryReq {
  id: string;
  name: string;
  mainCategoryId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
} 