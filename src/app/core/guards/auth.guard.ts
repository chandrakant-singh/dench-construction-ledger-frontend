import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { StorageUtils } from '../utils/storage.utils';
import { Constants } from '../../shared/constants/constants';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(): boolean | UrlTree {
    return this.checkToken();
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    return this.checkToken();
  }

  private checkToken(): boolean | UrlTree {
    const adminToken = StorageUtils.getAdminToken();
    const supervisorToken = StorageUtils.getSupervisorToken();
    const superAdminToken = StorageUtils.getSuperAdminToken();

    if (superAdminToken) {
      return true;
    } else if (adminToken) {
      return true;
    } else if (supervisorToken) {
      return true;
    } else {
      return false;
    }
  }
}
