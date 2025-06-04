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
  private currentUser: any = null;

  constructor(private http: HttpClient, private router: Router) { }

  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  }

  login(user: any) {
    return this.http.post(`${this.apiUrl}/login_with_jwt`, user, { observe: 'response' });
  }

  saveTokenInSessionStorage(token: any) {
    if (this.isBrowser()) {
      this.jwtToken = token.body.token;
      localStorage.setItem('access_token', this.jwtToken);

      const jwtHelper = new JwtHelperService();
      const decodedToken = jwtHelper.decodeToken(this.jwtToken);

      // Correction ici : on prend le premier champ d'id trouvé
      this.currentUser = {
        id: decodedToken.userId || decodedToken.id || decodedToken.uid,
        username: decodedToken.sub,
        roles: decodedToken.roles.map((r: any) => r.authority || r)
      };

      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
  }

  loadSessionData(): void {
    if (this.isBrowser()) {
      this.jwtToken = localStorage.getItem('access_token');
      const user = localStorage.getItem('currentUser');
      if (user) {
        this.currentUser = JSON.parse(user);
      }
    }
  }

  getCurrentUser() {
    if (this.currentUser) {
      return this.currentUser;
    }
    if (this.isBrowser()) {
      const user = localStorage.getItem('currentUser');
      if (user) {
        this.currentUser = JSON.parse(user);
        return this.currentUser;
      }
    }
    return null;
  }

  getToken() {
    return this.jwtToken;
  }

  getTokenFromSessionStorage() {
    if (this.isBrowser()) {
      this.jwtToken = localStorage.getItem('access_token');
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

    // Si les rôles sont des objets avec une propriété "authority"
    if (roles && roles.length > 0 && roles[0].authority) {
      return roles.some((role: any) => role.authority === 'CORDINATEUR');
    }

    // Si les rôles sont des chaînes simples
    return roles && roles.includes('CORDINATEUR');
  }

  isCandidat() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    const decodedToken = jwtHelper.decodeToken(this.jwtToken);
   // console.log("Token décodé:", decodedToken);

    const roles = decodedToken.roles;
   // console.log("Structure des rôles:", JSON.stringify(roles));

    // Vérifier si roles est un tableau d'objets avec authority
    if (roles && Array.isArray(roles) && roles.length > 0 && roles[0].authority) {
      const result = roles.some((role: any) => role.authority === 'CANDIDAT');
     // console.log("Vérification par authority:", result);
      return result;
    }

    // Vérifier si roles est un tableau de chaînes
    if (roles && Array.isArray(roles)) {
      const result = roles.includes('CANDIDAT');
     // console.log("Vérification par chaîne:", result);
      return result;
    }

    // Vérification plus générique
   // console.log("Aucune méthode de vérification n'a fonctionné");
    return false;
  }

  isJury() {
    if (this.jwtToken == null) {
      this.getTokenFromSessionStorage();
    }
    const jwtHelper = new JwtHelperService();
    const roles = jwtHelper.decodeToken(this.jwtToken).roles;

    // Si les rôles sont des objets avec une propriété "authority"
    if (roles && roles.length > 0 && roles[0].authority) {
      return roles.some((role: any) => role.authority === 'JURY');
    }

    // Si les rôles sont des chaînes simples
    return roles && roles.includes('JURY');
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('currentUser');
    this.currentUser = null;
    this.jwtToken = null;
    this.router.navigateByUrl('/login');
  }


}
