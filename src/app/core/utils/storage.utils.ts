import { Constants } from "../../shared/constants/constants";

export class StorageUtils {
  static setItem(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static getItem(key: string) {
    console.log('key', key);
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  static getAdminToken() {
    return localStorage.getItem(Constants.ADMIN_TOKEN) as string;
  }

  static getSupervisorToken() {
    return localStorage.getItem(Constants.SUPERVISOR_TOKEN) as string;
  }

  static getUserName() {
    return JSON.parse(localStorage.getItem(Constants.USER) as string).name;
  }

  static getUid() {
    return JSON.parse(localStorage.getItem(Constants.USER) as string).uid;
  }
}
