export interface MainCategory {
  id?: string;
  name: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}

export interface MainCategoryReq {
  id: string;
  name: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
} 