import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth.service';

// Interface Formation à exporter
export interface Formation {
  id?: number;
  nom: string;
  niveau: string;
  codeRncp: string;
  duree: string;
  prerequis: string;
  description: string;
  objectifs: string;
}

@Injectable({
  providedIn: 'root'
})
export class GestionFormationService {

   constructor(private authService: AuthService, private http: HttpClient) { }
   private apiUrl = environment.apiUrl;

   private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.getToken(),
      'Content-Type': 'application/json'
    });
  }
  getFormations(): Observable<Formation[]> {
    if(this.authService.getToken() == null){
      this.authService.getTokenFromSessionStorage();
    }
    return this.http.get<any[]>(`${this.apiUrl}/api/formations/all`, {headers: new HttpHeaders({Authorization: 'Bearer ' + this.authService.getToken()})});
  
  }

  ajouterFormation(formation: Formation): Observable<Formation> {
    return this.http.post<Formation>(this.apiUrl, formation);
  }

  modifierFormation(id: number, formation: Formation): Observable<Formation> {
    return this.http.put<Formation>(`${this.apiUrl}/api/formations/${id}`, formation);
    
  }

  supprimerFormation(id: number): Observable<string> {
    return this.http.delete<string>(`${this.apiUrl}/${id}/force-delete`, {
      headers: this.getAuthHeaders()
    });
  
  }
}
