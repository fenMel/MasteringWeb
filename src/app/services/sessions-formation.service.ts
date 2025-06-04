import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SessionsFormationService {

  constructor(private authService: AuthService, private http: HttpClient) { }
  private apiUrl = environment.apiUrl;

  getSessionsFormation(){
    if(this.authService.getToken() == null){
      this.authService.getTokenFromSessionStorage();
    }
    return this.http.get<any[]>(`${this.apiUrl}/users`, {headers: new HttpHeaders({Authorization: 'Bearer ' + this.authService.getToken()})});
  }


}
