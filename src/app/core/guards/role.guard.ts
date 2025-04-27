// import { Injectable } from '@angular/core';
// import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
// import { AuthService } from '../services/auth.service';

// @Injectable({ providedIn: 'root' })
// export class RoleGuard implements CanActivate {
//   constructor(private authService: AuthService, private router: Router) {}

//   canActivate(route: ActivatedRouteSnapshot): boolean {
//     const expectedRole = route.data['role'];
//     const user = this.authService.getCurrentUser(); // however you fetch user
//     if (user && user.role === expectedRole) {
//       return true;
//     }
//     this.router.navigate(['/login']);
//     return false;
//   }
// }
