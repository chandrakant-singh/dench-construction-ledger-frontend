export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  isDisabled?: boolean;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
