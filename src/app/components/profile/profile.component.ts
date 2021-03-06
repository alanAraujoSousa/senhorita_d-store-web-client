import { Component, OnInit } from '@angular/core';
import { AuthService, SocialUser } from 'angularx-social-login';
import { UserService, ResponseModel } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  myUser: any;

  constructor(private authService: AuthService,
              private userService: UserService,
              private router: Router) { }

  ngOnInit(): void {
    this.userService.userData$
      .pipe(
        map((user: SocialUser | ResponseModel) => {
          if (user instanceof SocialUser || user.type === 'social') {
            return {
              email: 'test@test.com',
              ...user
            };
          } else {
            return user;
          }
        })
      )
      .subscribe((data: ResponseModel | SocialUser) => {
        this.myUser = data;
      });
  }

  logout() {
    this.userService.logout();
  }

}
