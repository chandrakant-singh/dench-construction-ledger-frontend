import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NAV_ITEMS } from '../../constants/navitems';
import { Constants } from '../../constants/constants';

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

  constructor() {
    this.handleNavItem();
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
