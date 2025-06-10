import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment.prod';
import { AuthService } from './auth.service';
import { Decision } from '../decision/decision.model';

@Injectable({
  providedIn: 'root'
})
export class DecisionService {
  private apiUrl = environment.apiUrl;

  constructor(private authService: AuthService, private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.getToken()
    });
  }

  // --- CRUD DECISIONS ---

  getAllDecisions(): Observable<Decision[]> {
    return this.http.get<Decision[]>(`${this.apiUrl}/api/decisions`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des décisions:', error);
        return of([]);
      })
    );
  }

  getDecisionsByCandidat(candidatId: number): Observable<Decision[]> {
    return this.http.get<Decision[]>(`${this.apiUrl}/api/decisions/candidat/${candidatId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la récupération des décisions du candidat:', error);
        return of([]);
      })
    );
  }

  addDecision(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/decisions`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'ajout de la décision:', error);
        return of(null);
      })
    );
  }

  deleteDecision(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/decisions/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        console.error('Erreur lors de la suppression de la décision:', error);
        return of(null);
      })
    );
  }

  // --- UTILITAIRES ---

  // Ajoute ici d'autres méthodes si besoin (update, etc.)
}