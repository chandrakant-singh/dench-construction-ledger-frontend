import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NAV_ITEMS } from '../../constants/navitems';
import { Constants } from '../../constants/constants';
import { Offcanvas } from 'bootstrap';

@Component({
  selector: 'app-main-layout',
  imports: [RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  navItems: { label: string; path: string; roles: string[] }[] = [];
  private authService = inject(AuthService);
  private userService = inject(UserService);
  loggedInUserName = JSON.parse(localStorage.getItem(Constants.USER) as string).name
  private router = inject(Router);
  
  constructor() {
    this.handleNavItem();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && window.innerWidth < 768) {
        this.closeSidebar();
      }
    });
  }

  closeSidebar() {
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) {
      const bsOffcanvas = Offcanvas.getInstance(sidebarEl);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
    this.forceOffcanvasCleanup();
  }

  private forceOffcanvasCleanup() {
    // Wait a tick to allow Bootstrap to do its thing first
    setTimeout(() => {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''; // ✅ Fixes stuck scroll
      }

      const backdrop = document.querySelector('.offcanvas-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      document.body.classList.remove('offcanvas-backdrop', 'fade', 'show', 'modal-open'); // clean up

      document.body.style.overflow = 'auto'; // or ''
      if (backdrop) backdrop.remove();

    }, 500); // Slight delay ensures transition is complete
  }

  public logOut() {
    this.authService.logout()
    .then((res) => {
      console.log('Logout successful ', res);
    })
    .catch((error) => {
      console.log('Logout failed ', error);
    })
  }

  public handleNavItem() {
    this.navItems = NAV_ITEMS.filter(item => item.roles.includes(JSON.parse(localStorage.getItem(Constants.USER) as string).role));
  }


}
