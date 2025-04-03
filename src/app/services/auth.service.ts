import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;
  private jwtToken: any;
  public roles: any;
  public username: any;

  constructor(private http: HttpClient, private router: Router) { }

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  }

  login(user: any) {
    return this.http.post(`${this.apiUrl}/login_with_jwt`, user, { observe: 'response' });
  }

  saveTokenInSessionStorage(token: any) {
    if (this.isBrowser()) {
      sessionStorage.setItem('access_token', token.body.token);
      this.jwtToken = token.body.token;
      const jwtHelper = new JwtHelperService();
      this.decodeMyToken();
    }
  }

  getTokenFromSessionStorage() {
    if (this.isBrowser()) {
      this.jwtToken = sessionStorage.getItem('access_token');
    }
  }

  getUsernameFromTokenSessionStorage() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    return jwtHelper.decodeToken(this.jwtToken).sub;
  }

  getRolesFromTokenSessionStorage() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    return jwtHelper.decodeToken(this.jwtToken).roles;
  }

  decodeMyToken() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    this.roles = jwtHelper.decodeToken(this.jwtToken).roles;
    this.username = jwtHelper.decodeToken(this.jwtToken).sub;
  }

  isConnected() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    if (this.jwtToken == null) {
      return null;
    } else {
      const jwtHelper = new JwtHelperService();
      this.roles = jwtHelper.decodeToken(this.jwtToken).roles;
      this.username = jwtHelper.decodeToken(this.jwtToken).sub;

      const user = { username: this.username, roles: this.roles };
      const isExpired = jwtHelper.isTokenExpired(this.jwtToken);
      if (!isExpired) {
        return user;
      } else {
        return null;
      }
    }

  }

  // isRole : COORDINATEUR, CANDIDAT, JURY, APPRENANT, SUPERVISOR, SUPPORT_STAFF

  isCoordinateur() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    const roles = jwtHelper.decodeToken(this.jwtToken).roles;
    return roles.includes('CORDINATEUR');
  }

  isCandidat() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    const roles = jwtHelper.decodeToken(this.jwtToken).roles;
    return roles.includes('CANDIDAT');
  }

  isJury() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    const roles = jwtHelper.decodeToken(this.jwtToken).roles;
    return roles.includes('JURY');
  }

  isApprenant() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    const roles = jwtHelper.decodeToken(this.jwtToken).roles;
    return roles.includes('APPRENANT');
  }

  isSupervisor() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    const roles = jwtHelper.decodeToken(this.jwtToken).roles;
    return roles.includes('SUPERVISOR');
  }

  isSupportStaff() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    const roles = jwtHelper.decodeToken(this.jwtToken).roles;
    return roles.includes('SUPPORT_STAFF');
  }


  logout() {
    sessionStorage.removeItem('access_token');
    this.jwtToken = null;
    this.router.navigateByUrl('/login');
  }


}
