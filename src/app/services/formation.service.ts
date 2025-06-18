import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Formation } from '../ajouter-formation/formation.model';

@Injectable({
  providedIn: 'root'
})
export class FormationService {
  private apiUrl = environment.apiUrl + '/api/formations';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.getToken(),
      'Content-Type': 'application/json'
    });
  }
  getFormations(): Observable<Formation[]> {
    return this.http.get<Formation[]>(`${this.apiUrl}/all`, {
      headers: this.getAuthHeaders()
    });
  }
  ajouterFormation(formation: Formation): Observable<Formation> {
    return this.http.post<Formation>(`${this.apiUrl}/create`, formation, {
      headers: this.getAuthHeaders()
    });
  }

  

  supprimerFormation(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  
  }
}
