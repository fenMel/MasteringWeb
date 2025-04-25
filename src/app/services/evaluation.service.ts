import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evaluation } from '../evaluation/evaluation.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment.prod';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  constructor(private authService: AuthService, private http: HttpClient) { }

  private apiUrl = environment.apiUrl;

  // Helper method to get auth headers
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: 'Bearer ' + this.authService.getToken()
    });
  }

  // Méthodes existantes
  getAllEvaluations(): Observable<Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.apiUrl}/api/evaluations`, {
      headers: this.getAuthHeaders()
    });
  }

  getEvaluationsFiltered(dateRange: string, statut: string, candidat: string): Observable<Evaluation[]> {
    let params = new HttpParams();
    
    if (dateRange && dateRange !== 'Toutes les dates') {
      params = params.set('dateRange', dateRange);
    }
    
    if (statut && statut !== 'Tout les statuts') {
      params = params.set('statut', statut);
    }
    
    if (candidat) {
      params = params.set('candidat', candidat);
    }
    
    return this.http.get<Evaluation[]>(`${this.apiUrl}/api/evaluations`, {
      headers: this.getAuthHeaders(),
      params: params
    });
  }

  evaluer(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/evaluations/${id}/evaluer`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Nouvelles méthodes pour le composant d'ajout d'évaluation
  getCandidat(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/evaluations/candidat/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getCandidats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations/candidat`, {
      headers: this.getAuthHeaders()
    });
  }

  getCriteres(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/criteres`, {
      headers: this.getAuthHeaders()
    });
  }

  createEvaluation(evaluation: any): Observable<Evaluation> {
    return this.http.post<Evaluation>(`${this.apiUrl}/api/evaluations`, evaluation, {
      headers: this.getAuthHeaders()
    });
  }

  getEvaluation(id: number): Observable<Evaluation> {
    return this.http.get<Evaluation>(`${this.apiUrl}/api/evaluations/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  updateEvaluation(id: number, evaluation: any): Observable<Evaluation> {
    return this.http.put<Evaluation>(`${this.apiUrl}/api/evaluations/${id}`, evaluation, {
      headers: this.getAuthHeaders()
    });
  }
  
  // Récupérer uniquement les candidats présents à la soutenance
  getCandidatsPresents(): Observable<any[]> {
    // Ajout du paramètre present=true pour filtrer
    const params = new HttpParams().set('present', 'true');
    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations/candidat`, { 
      headers: this.getAuthHeaders(),
      params 
    });
  }

  // Récupérer tous les candidats pour une date de soutenance spécifique
  getCandidatsParDate(date: string): Observable<any[]> {
    const params = new HttpParams()
      .set('date', date)
      .set('present', 'true');
    return this.http.get<any[]>(`${this.apiUrl}/api/evaluations/candidat`, { 
      headers: this.getAuthHeaders(),
      params 
    });
  }
  getCandidatsParIds(ids: number[]): Observable<any[]> {
    // nous allons utiliser forkJoin pour faire plusieurs requêtes en parallèle
    const requests = ids.map(id => this.getCandidat(id));
    return forkJoin(requests);
  }
}