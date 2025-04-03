import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  errorMessage: string = '';
  isLoading: boolean = false;
  token: any;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    if (this.authService.isConnected() !== null) {
      this.dashboardMod1();
    }
  }

  login(val: any): void {
    this.isLoading = true;
    this.authService.login(val).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.authService.saveTokenInSessionStorage(res);
          this.dashboardMod1();
        } else {
          this.errorMessage = 'Invalid username or password';
        }
      },
      error: (err) => {
        this.errorMessage = 'Invalid username or password';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  dashboardMod1() {
    this.router.navigateByUrl('/dashboard');
  }

  // au cas vous aurez plusieurs dashboard, mais si c'est 1 seul dashboard, utiliser les methodes de AuthService (isCoordinateur() par exemple)
  dashboardMod2(roles: any): void {
    //Role : CORDINATEUR, CANDIDAT, JURY, APPRENANT, SUPERVISOR, SUPPORT_STAFF

    // attention le roles est une list avec pour chaque role, un atribut authority qui contient le role
    // donc il faut le parcourir et verifier si il y a un role qui contient le role qu'on veut

    if (roles.some((role: any) => role.authority === 'CORDINATEUR')) {
      this.router.navigate(['/dashboard/coordonateur']);
    } else if (roles.some((role: any) => role.authority === 'CANDIDAT')) {
      this.router.navigate(['/dashboard/candidat']);
    } else if (roles.some((role: any) => role.authority === 'JURY')) {
      this.router.navigate(['/dashboard/jury']);
    } else if (roles.some((role: any) => role.authority === 'APPRENANT')) {
      this.router.navigate(['/dashboard/apprenant']);
    } else if (roles.some((role: any) => role.authority === 'SUPERVISOR')) {
      this.router.navigate(['/dashboard/superviseur']);
    } else if (roles.some((role: any) => role.authority === 'SUPPORT_STAFF')) {
      this.router.navigate(['/dashboard/support']);
    } else {
      this.errorMessage = 'Invalid role';
      this.authService.logout();
    }
  }
}
